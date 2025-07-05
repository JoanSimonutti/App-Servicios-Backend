///////////////////////////////////////////////////////////////////////////////////////
// routes/profile.js
//
// Qué hace este archivo:
// Implementa las rutas para que el prestador logueado pueda:
// - consultar su perfil (GET /profile)
// - modificarlo (PUT /profile)
// - borrarlo con soft delete (DELETE /profile)
//
// Todas las rutas están protegidas con JWT mediante authMiddleware.
// Usamos el teléfono del token JWT para identificar al prestador.
//
// Gracias a este archivo:
// Cada prestador gestiona SOLO SU perfil.
// Implementamos soft delete para seguridad.
// Mantenemos la arquitectura separada y profesional.
///////////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const router = express.Router();
const Joi = require("joi");

// Importamos el modelo Service (perfil del prestador)
const Service = require("../models/service");

// Importamos nuestro middleware de autenticación
const authMiddleware = require("../middlewares/authMiddleware");

// Importamos el logger profesional (Winston)
const logger = require("../utils/logger");

///////////////////////////////////////////////////////////////////////////////////////
// Definimos el esquema Joi para validar el update del perfil
//
// Importante:
// → No permitimos modificar el teléfono porque es la clave de autenticación.
//
// Los campos opcionales permiten editar solo lo que el usuario desee cambiar.
//
///////////////////////////////////////////////////////////////////////////////////////

const profileUpdateSchema = Joi.object({
    nombre: Joi.string().min(3).max(100),
    categoria: Joi.string(),
    tipoServicio: Joi.string(),
    localidad: Joi.string(),
    horarios: Joi.string(),
    urgencias24hs: Joi.boolean(),
    localidadesCercanas: Joi.array().items(Joi.string()),
    descripcion: Joi.string().max(500),
    // cualquier otro campo que tengas en Service
});

///////////////////////////////////////////////////////////////////////////////////////
// GET /profile
//
// Qué hace:
// - Devuelve el perfil del prestador logueado.
// - Busca el Service cuyo teléfono coincide con el del JWT.
// - No devuelve perfiles marcados como deleted.
//
// Ejemplo:
// GET /profile
// Headers:
//    Authorization: Bearer <token>
///////////////////////////////////////////////////////////////////////////////////////

router.get("/", authMiddleware, async (req, res) => {
    try {
        // Tomamos el teléfono del token JWT
        const telefono = req.user.telefono;

        // Buscamos el Service asociado
        const service = await Service.findOne({
            telefono,
            deleted: false
        });

        if (!service) {
            return res.status(404).json({ error: "Perfil no encontrado." });
        }

        logger.info(`Perfil consultado: ${telefono}`);

        return res.json(service);

    } catch (err) {
        logger.error(`Error en GET /profile: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// PUT /profile
//
// Qué hace:
// - Permite modificar datos del perfil del prestador logueado.
// - No permite modificar el teléfono.
// - Solo modifica campos enviados en el body.
//
// Ejemplo:
// PUT /profile
// Headers:
//    Authorization: Bearer <token>
// Body:
//    { nombre: "Nuevo Nombre", localidad: "Valencia" }
///////////////////////////////////////////////////////////////////////////////////////

router.put("/", authMiddleware, async (req, res) => {
    try {
        // Validamos el body recibido
        const { error, value } = profileUpdateSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            const errores = error.details.map(err => err.message);
            return res.status(400).json({ errores });
        }

        // Tomamos el teléfono del token JWT
        const telefono = req.user.telefono;

        // Buscamos el Service del usuario
        const service = await Service.findOne({
            telefono,
            deleted: false
        });

        if (!service) {
            return res.status(404).json({ error: "Perfil no encontrado." });
        }

        // Actualizamos SOLO los campos enviados en el body
        Object.keys(value).forEach(key => {
            service[key] = value[key];
        });

        await service.save();

        logger.info(`Perfil actualizado: ${telefono}`);

        return res.json({
            mensaje: "Perfil actualizado correctamente.",
            service
        });

    } catch (err) {
        logger.error(`Error en PUT /profile: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// DELETE /profile
//
// Qué hace:
// - Implementa soft delete del perfil.
// - No borra el documento físicamente.
// - Marca:
//     deleted: true
//     deletedAt: fecha y hora actual
//
// Ejemplo:
// DELETE /profile
// Headers:
// Authorization: Bearer <token>
///////////////////////////////////////////////////////////////////////////////////////

router.delete("/", authMiddleware, async (req, res) => {
    try {
        // Tomamos el teléfono del token JWT
        const telefono = req.user.telefono;

        // Buscamos el Service del usuario
        const service = await Service.findOne({
            telefono,
            deleted: false
        });

        if (!service) {
            return res.status(404).json({ error: "Perfil no encontrado." });
        }

        // Marcamos soft delete
        service.deleted = true;
        service.deletedAt = new Date();

        await service.save();

        logger.info(`Perfil soft deleted: ${telefono}`);

        return res.json({
            mensaje: "Perfil eliminado correctamente (soft delete)."
        });

    } catch (err) {
        logger.error(`Error en DELETE /profile: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// NOTA IMPORTANTE
//
// En el futuro, conviene que SOLO el admin pueda ejecutar el endpoint:
// DELETE /profile/cleanup
//
// Por qué:
// Es un endpoint peligroso si lo ejecuta un usuario común.
// Podría borrar perfiles soft deleted antes de tiempo.
//
// Cómo hacerlo:
// - Usar roles en el JWT (ej. role: "admin").
// - Crear middleware para chequear req.user.role === "admin".
// - Responder 403 Forbidden si no es admin.
//
// Ejemplo futuro:
//
// if (req.user.role !== "admin") {
//     return res.status(403).json({ error: "No autorizado." });
// }
//
// Por ahora:
// - Cualquiera autenticado puede llamar cleanup.
// - Pero confiamos en que solo Joan lo va a usar.
//
///////////////////////////////////////////////////////////////////////////////////////
//
// DELETE /profile/cleanup
//
// Qué hace:
// - Borra PERMANENTEMENTE todos los perfiles soft deleted
//   que llevan más de 30 días marcados como eliminados.
//
// Por qué es importante:
// Evita acumulación innecesaria de datos.
// Mantiene la base liviana y ordenada.
// Cumple buenas prácticas de privacidad (limpieza de datos).
//
// Consideraciones:
// - Solo debería ejecutarlo un admin o un proceso de cron.
// - En producción convendría protegerlo con permisos de admin.
//
// Ejemplo:
// DELETE /profile/cleanup
// Headers:
//    Authorization: Bearer <token>
///////////////////////////////////////////////////////////////////////////////////////

router.delete("/cleanup", authMiddleware, async (req, res) => {
    try {
        // Calculamos la fecha límite → 30 días atrás
        const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Ejecutamos el borrado definitivo
        const result = await Service.deleteMany({
            deleted: true,
            deletedAt: { $lte: fechaLimite }
        });

        logger.info(`Cleanup definitivo ejecutado. Perfiles eliminados: ${result.deletedCount}`);

        return res.json({
            mensaje: "Cleanup definitivo ejecutado.",
            perfilesEliminados: result.deletedCount
        });

    } catch (err) {
        logger.error(`Error en DELETE /profile/cleanup: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});


///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el router para integrarlo en index.js
///////////////////////////////////////////////////////////////////////////////////////

module.exports = router;

///////////////////////////////////////////////////////////////////////////////////////
// Gracias a este archivo:
// Los prestadores pueden consultar y modificar su propio perfil.
// Implementamos soft delete de forma segura.
// Todas las rutas están protegidas por JWT.
// Logs profesionales registran cada operación.
// La arquitectura queda limpia y escalable.
///////////////////////////////////////////////////////////////////////////////////////

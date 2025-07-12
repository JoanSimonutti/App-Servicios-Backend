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
// NUEVO:
// Definimos el listado completo de categorías válidas.
//
// Esto asegura coherencia entre el modelo Service (Mongoose)
// y las validaciones Joi del perfil.
//
// Nota profesional:
// En el futuro sería ideal importar este array desde un archivo
// único (p. ej. categoryGroups.js) para evitar duplicaciones.
//
///////////////////////////////////////////////////////////////////////////////////////

const VALID_CATEGORIES = [
    // =========================================================
    // Servicios para el hogar
    // =========================================================
    "Plomería",
    "Electricidad",
    "Herrería",
    "Carpintería",
    "Gas",
    "Informática",
    "Limpieza doméstica",
    "Fumigación",
    "Reparaciones generales",
    "Climatización (aires, calefacción)",
    "Colocación de pisos / revestimientos",
    "Vidriería",
    "Impermeabilización",
    "Rejas y estructuras metálicas",
    "Colocación de cortinas",
    "Mantenimiento de piletas",
    "Armado de muebles",
    "Persianas y toldos",

    // =========================================================
    // Servicios para el cuidado de la familia
    // =========================================================
    "Enfermería",
    "Medicina a domicilio",
    "Niñeras",
    "Acompañante terapéutico",
    "Psicólogos",
    "Fonoaudiólogos",
    "Maestras particulares",
    "Kinesiología",
    "Terapias alternativas",
    "Psicopedagogía",
    "Fisioterapia",
    "Cuidadores de adultos mayores",
    "Acompañamiento escolar",
    "Logopedas",
    "Musicoterapia",
    "Asistencia escolar a domicilio",

    // =========================================================
    // Lavadero y mantenimiento
    // =========================================================
    "Lavadero de ropa",
    "Lavadero de coches",
    "Tintorerías",
    "Limpieza de alfombras y tapizados",
    "Limpieza industrial / comercial",
    "Lavado de sillones",
    "Limpieza de cortinas",
    "Servicios de planchado",
    "Lavado de colchones",
    "Limpieza post obra",
    "Limpieza de piletas",
    "Limpieza de vidrios en altura",
    "Lavado de tapizados de autos",
    "Limpieza de tanques de agua",

    // =========================================================
    // Profesionales y técnicos
    // =========================================================
    "Abogados",
    "Contadores",
    "Traductores",
    "Asesores impositivos",
    "Ingenieros",
    "Arquitectos",
    "Desarrolladores de software",
    "Diseñadores gráficos",
    "Marketing digital",
    "Reparadores de electrodomésticos",
    "Técnicos electrónicos",
    "Electricistas matriculados",
    "Gestores administrativos",
    "Técnicos en refrigeración",
    "Técnicos de PC",
    "Diseñadores industriales",
    "Auditores",
    "Consultores empresariales",
    "Gestoría vehicular",
    "Peritos",
    "Agrimensores",
    "Topógrafos",
    "Fotógrafos profesionales",

    // =========================================================
    // Eventos y entretenimiento
    // =========================================================
    "Fotografía y video de eventos",
    "Música en vivo",
    "Animadores infantiles",
    "Catering",
    "Decoradores",
    "Alquiler de livings y mobiliario",
    "Pastelería para eventos",
    "Organización de fiestas",
    "Sonido e iluminación",
    "Magos / shows",
    "Carpas y gazebos para eventos",
    "Bartenders",
    "Alquiler de vajilla",
    "Wedding planners",
    "Food trucks",
    "Animación para adultos",
    "Cotillón personalizado",
    "Escenografía para eventos",

    // =========================================================
    // Transporte y logística
    // =========================================================
    "Fletes",
    "Mudanzas",
    "Moto mensajería",
    "Chofer particular",
    "Transportes especiales",
    "Delivery de productos voluminosos",
    "Transporte de personas",
    "Transporte de mascotas",
    "Cargas refrigeradas",
    "Transporte escolar",
    "Courier internacional",
    "Alquiler de camionetas",
    "Chofer profesional para empresas",
    "Distribución de correspondencia",
    "Traslados corporativos",
    "Camiones con hidrogrúa",

    // =========================================================
    // Animales y mascotas
    // =========================================================
    "Paseadores de perros",
    "Peluquería canina / felina",
    "Adiestradores",
    "Veterinarios a domicilio",
    "Guarderías caninas",
    "Venta de alimentos y accesorios",
    "Educación canina",
    "Etología animal",
    "Adopciones responsables",
    "Fotografía de mascotas",
    "Hospedaje para mascotas",
    "Terapias alternativas animales",
    "Spa para mascotas",
    "Adiestramiento felino",

    // =========================================================
    // Estética
    // =========================================================
    "Peluquería hombre, mujer y niños",
    "Barberías",
    "Cosmetología",
    "Manicura / Pedicura",
    "Maquillaje profesional",
    "Depilación",
    "Masajes estéticos",
    "Spa a domicilio",
    "Estética corporal",
    "Tratamientos faciales",
    "Microblading",
    "Diseño de cejas",
    "Peinados para eventos",
    "Uñas esculpidas",
    "Extensiones de pestañas",
    "Micropigmentación",
    "Limpieza facial profunda",
    "Bronceado sin sol",
    "Diseño de sonrisa estética",

    // =========================================================
    // Categorías originales
    // =========================================================
    "Pastelería",
    "Huevos de Gallina"
];

///////////////////////////////////////////////////////////////////////////////////////
// Definimos el esquema Joi para validar el update del perfil
//
// Importante:
// → No permitimos modificar el teléfono porque es la clave de autenticación.
//
// NUEVO:
// Ahora la validación de "categoria" se hace estricta usando .valid(...VALID_CATEGORIES).
//
// Esto impide que se graben categorías inexistentes.
//
///////////////////////////////////////////////////////////////////////////////////////

const profileUpdateSchema = Joi.object({
    nombre: Joi.string().min(3).max(100),
    categoria: Joi.string().valid(...VALID_CATEGORIES), // NUEVO: validación estricta
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
        const telefono = req.user.telefono;

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
        const { error, value } = profileUpdateSchema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            const errores = error.details.map(err => err.message);
            return res.status(400).json({ errores });
        }

        const telefono = req.user.telefono;

        const service = await Service.findOne({
            telefono,
            deleted: false
        });

        if (!service) {
            return res.status(404).json({ error: "Perfil no encontrado." });
        }

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
        const telefono = req.user.telefono;

        const service = await Service.findOne({
            telefono,
            deleted: false
        });

        if (!service) {
            return res.status(404).json({ error: "Perfil no encontrado." });
        }

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
        const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

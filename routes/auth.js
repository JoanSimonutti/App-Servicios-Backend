///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo auth.js?
// Es la pieza fundamental para nuestro login solo con SMS
//
// /auth/register:
// recibe teléfono
// genera código
// envía SMS
//
// /auth/verify:
// recibe teléfono + código
// valida
// devuelve JWT
//
// Ventajas de este archivo:
// - Seguridad: maneja el ciclo completo de autenticación.
// - Claridad: cada ruta tiene una sola responsabilidad.
// - Escalabilidad: fácilmente ampliable si en el futuro queremos password o refresh tokens.
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
// Importamos las librerías y módulos necesarios
///////////////////////////////////////////////////////////////////////////////////////

const express = require("express");  // Framework web
const router = express.Router();     // Sistema de rutas de Express
const Joi = require("joi");          // Validaciones de datos
const jwt = require("jsonwebtoken"); // Para generar el token JWT

// Importamos el modelo User (prestador)
const User = require("../models/user");

// Importamos nuestra función para enviar SMS vía Twilio
const sendSMS = require("../utils/sendSMS");

// Importamos logger profesional
const logger = require("../utils/logger");

///////////////////////////////////////////////////////////////////////////////////////
// Validación estricta de teléfono
//
// Qué hace:
// Creamos un esquema Joi reutilizable para validar que el teléfono:
// - Empiece obligatoriamente con "+".
// - Tenga de 8 a 15 dígitos.
// Ejemplo válido: +34123456789
//
// Por qué es importante:
// Aseguramos que se guarden solo números en formato internacional.
// Evitamos errores y costos innecesarios en Twilio.
// Protegemos la integridad de la base de datos.
//
///////////////////////////////////////////////////////////////////////////////////////

const telefonoSchema = Joi.string()
    .pattern(/^\+\d{8,15}$/)
    .required()
    .messages({
        "string.pattern.base": "El número de teléfono debe comenzar con '+' y tener entre 8 y 15 dígitos."
    });

///////////////////////////////////////////////////////////////////////////////////////
// POST /auth/register
// Endpoint que inicia el proceso de registro o login vía SMS.
//
// Qué hace:
// - Recibe el teléfono del prestador.
// - Genera un código numérico aleatorio.
// - Guarda ese código en la base con fecha de expiración.
// - Envia el SMS con Twilio.
//
// Si el usuario ya existe → actualiza el código.
// Si no existe → crea uno nuevo.
//
// Ejemplo request:
// POST /auth/register
// {
//   "telefono": "+34123456789"
// }
///////////////////////////////////////////////////////////////////////////////////////

router.post("/register", async (req, res) => {
    try {
        // Definimos el esquema Joi para validar el teléfono
        const schema = Joi.object({
            // Usamos nuestro nuevo esquema
            telefono: telefonoSchema
        });

        // Validamos los datos recibidos
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { telefono } = req.body;

        // Generamos un código aleatorio de 6 dígitos (ej: 426731)
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // Definimos la expiración del código (10 minutos desde ahora)
        const codigoExpira = new Date(Date.now() + 10 * 60 * 1000);

        // Buscamos si el usuario ya existe
        let user = await User.findOne({ telefono });

        if (!user) {
            // Si NO existe → creamos un nuevo usuario
            user = new User({
                telefono,
                codigoVerificacion: codigo,
                codigoExpira,
                verificado: false
            });
        } else {
            // Si ya existe → actualizamos su código de verificación
            user.codigoVerificacion = codigo;
            user.codigoExpira = codigoExpira;
            user.verificado = false;
        }

        // Guardamos el usuario en la base
        await user.save();

        // Armamos el mensaje que vamos a enviar por SMS
        const mensajeSMS = `Tu código de verificación en SERVIPRO es: ${codigo}`;

        ///////////////////////////////////////////////////////////////////////////////////////
        // COMIENZO DE BLOQUE COMENTADO → DESACTIVAMOS ENVÍO REAL DE SMS
        //
        // Qué hacemos:
        // - Comentamos esta línea para que Twilio NO se ejecute en ambiente de desarrollo.
        // - De esta manera podemos registrar usuarios sin límite y sin depender del Trial.
        //
        // await sendSMS(telefono, mensajeSMS);
        //
        // En su lugar, dejamos un logger para saber qué SMS **se hubiese enviado**.
        ///////////////////////////////////////////////////////////////////////////////////////

        // logger.info(`(SIMULACIÓN) SMS a ${telefono}: ${mensajeSMS}`);

        // Usamos logger.info en lugar de console.log
        logger.info(`(SIMULACIÓN) SMS a ${telefono}: ${mensajeSMS}`);

        // Respondemos al frontend
        return res.json({
            mensaje: "Código de verificación enviado (modo desarrollo, SMS simulado).",
            codigo: codigo // Opcional → solo para pruebas, quitá esto en producción
        });

    } catch (err) {
        // Usamos logger.error en lugar de console.error
        logger.error(`Error en /auth/register: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// POST /auth/verify
// Endpoint que verifica el código ingresado por el prestador.
//
// Qué hace:
// - Recibe teléfono y código.
// - Busca el usuario en base de datos.
// - Verifica si el código coincide y no está vencido.
// - Si está todo bien:
//    - Marca el usuario como verificado.
//    - Borra el código.
//    - Genera un token JWT para autenticarlo.
//
// Ejemplo request:
// POST /auth/verify
// {
//   "telefono": "+34123456789",
//   "codigo": "426731"
// }
///////////////////////////////////////////////////////////////////////////////////////

router.post("/verify", async (req, res) => {
    try {
        // Definimos el esquema Joi para validar el input
        const schema = Joi.object({
            // Usamos nuestro nuevo esquema
            telefono: telefonoSchema,
            codigo: Joi.string().length(6).required()
        });

        // Validamos los datos recibidos
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { telefono, codigo } = req.body;

        // Buscamos el usuario por teléfono
        const user = await User.findOne({ telefono });

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // Verificamos si el código coincide
        if (user.codigoVerificacion !== codigo) {
            return res.status(400).json({ error: "Código incorrecto." });
        }

        // Verificamos si el código está vencido
        if (user.codigoExpira < new Date()) {
            return res.status(400).json({ error: "El código ha expirado." });
        }

        // Marcamos el usuario como verificado
        user.verificado = true;

        // Borramos el código para que no pueda usarse de nuevo
        user.codigoVerificacion = null;
        user.codigoExpira = null;

        await user.save();

        // Creamos el payload para el JWT
        const payload = {
            userId: user._id,
            telefono: user.telefono,
            verificado: user.verificado,
            role: "user"
        };

        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: jwtExpiresIn }
        );

        // Usamos logger.info en lugar de console.log
        logger.info(`Usuario ${telefono} verificado y JWT emitido.`);

        // Respondemos al frontend con el token
        return res.json({
            mensaje: "Teléfono verificado correctamente.",
            token
        });

    } catch (err) {
        // Usamos logger.error en lugar de console.error
        logger.error(`Error en /auth/verify: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// DELETE /auth/cleanup
//
// Qué hace:
// Endpoint para limpieza de la base de datos.
//
// - Busca usuarios cuyo código de verificación ya venció.
// - Borra los campos:
//    - codigoVerificacion
//    - codigoExpira
// - Devuelve cuántos usuarios fueron limpiados.
//
// Por qué es importante:
// Mantiene la base de datos limpia y liviana.
// Elimina datos innecesarios y caducos.
// Buenas prácticas de mantenimiento.
//
// Ejemplo request:
// DELETE /auth/cleanup
///////////////////////////////////////////////////////////////////////////////////////

router.delete("/cleanup", async (req, res) => {
    try {
        const result = await User.updateMany(
            { codigoExpira: { $lt: new Date() } },
            {
                $unset: {
                    codigoVerificacion: "",
                    codigoExpira: ""
                }
            }
        );

        // Usamos logger.info en lugar de console.log
        logger.info(`Cleanup ejecutado. Usuarios modificados: ${result.modifiedCount}`);

        return res.json({
            success: true,
            message: `Códigos expirados eliminados.`,
            usuariosLimpiados: result.modifiedCount
        });

    } catch (err) {
        // Usamos logger.error en lugar de console.error
        logger.error(`Error en /auth/cleanup: ${err.message}`);
        return res.status(500).json({ error: "Error interno al limpiar códigos expirados." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el router para que pueda integrarse en index.js
///////////////////////////////////////////////////////////////////////////////////////

module.exports = router;

///////////////////////////////////////////////////////////////////////////////////////
// Gracias a este archivo:
// Tenemos flujo completo de registro y login solo con SMS.
// Los prestadores están protegidos con JWT.
// Todo el proceso está validado y es seguro.
// Estamos listos para proteger rutas privadas en el backend.
// Limpieza automática de códigos expirados,
// manteniendo nuestra base de datos optimizada y ordenada.
// Validación estricta del teléfono en formato internacional.
// JWT incluye más datos para el frontend.
// Logs profesionales con Winston,
// para máxima trazabilidad y mantenimiento.
///////////////////////////////////////////////////////////////////////////////////////

// ESTO DE ACA ABAJO ES LO QUE ESTABA ANTES CON EL BLOQUE DE TWILIO 100% FUNCIONAL,
// LO DEJO COMENTADO ACA ABAJO POR SI CUANDO QUIERA VOLVER A TRABAJAR CON TWILIO ME APARECE ALGUN PROBLEMA

/*
///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo auth.js?
// Es la pieza fundamental para nuestro login solo con SMS
//
// /auth/register:
// recibe teléfono
// genera código
// envía SMS
//
// /auth/verify:
// recibe teléfono + código
// valida
// devuelve JWT
//
// Ventajas de este archivo:
// - Seguridad: maneja el ciclo completo de autenticación.
// - Claridad: cada ruta tiene una sola responsabilidad.
// - Escalabilidad: fácilmente ampliable si en el futuro queremos password o refresh tokens.
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
// Importamos las librerías y módulos necesarios
///////////////////////////////////////////////////////////////////////////////////////

const express = require("express");  // Framework web
const router = express.Router();     // Sistema de rutas de Express
const Joi = require("joi");          // Validaciones de datos
const jwt = require("jsonwebtoken"); // Para generar el token JWT

// Importamos el modelo User (prestador)
const User = require("../models/user");

// Importamos nuestra función para enviar SMS vía Twilio
const sendSMS = require("../utils/sendSMS");

// Importamos logger profesional
const logger = require("../utils/logger");

///////////////////////////////////////////////////////////////////////////////////////
// Validación estricta de teléfono
//
// Qué hace:
// Creamos un esquema Joi reutilizable para validar que el teléfono:
// - Empiece obligatoriamente con "+".
// - Tenga de 8 a 15 dígitos.
// Ejemplo válido: +34123456789
//
// Por qué es importante:
// Aseguramos que se guarden solo números en formato internacional.
// Evitamos errores y costos innecesarios en Twilio.
// Protegemos la integridad de la base de datos.
//
///////////////////////////////////////////////////////////////////////////////////////

const telefonoSchema = Joi.string()
    .pattern(/^\+\d{8,15}$/)
    .required()
    .messages({
        "string.pattern.base": "El número de teléfono debe comenzar con '+' y tener entre 8 y 15 dígitos."
    });

///////////////////////////////////////////////////////////////////////////////////////
// POST /auth/register
// Endpoint que inicia el proceso de registro o login vía SMS.
//
// Qué hace:
// - Recibe el teléfono del prestador.
// - Genera un código numérico aleatorio.
// - Guarda ese código en la base con fecha de expiración.
// - Envia el SMS con Twilio.
//
// Si el usuario ya existe → actualiza el código.
// Si no existe → crea uno nuevo.
//
// Ejemplo request:
// POST /auth/register
// {
//   "telefono": "+34123456789"
// }
///////////////////////////////////////////////////////////////////////////////////////

router.post("/register", async (req, res) => {
    try {
        // Definimos el esquema Joi para validar el teléfono
        const schema = Joi.object({
            // Usamos nuestro nuevo esquema
            telefono: telefonoSchema
        });

        // Validamos los datos recibidos
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { telefono } = req.body;

        // Generamos un código aleatorio de 6 dígitos (ej: 426731)
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // Definimos la expiración del código (10 minutos desde ahora)
        const codigoExpira = new Date(Date.now() + 10 * 60 * 1000);

        // Buscamos si el usuario ya existe
        let user = await User.findOne({ telefono });

        if (!user) {
            // Si NO existe → creamos un nuevo usuario
            user = new User({
                telefono,
                codigoVerificacion: codigo,
                codigoExpira,
                verificado: false
            });
        } else {
            // Si ya existe → actualizamos su código de verificación
            user.codigoVerificacion = codigo;
            user.codigoExpira = codigoExpira;
            user.verificado = false;
        }

        // Guardamos el usuario en la base
        await user.save();

        // Armamos el mensaje que vamos a enviar por SMS
        const mensajeSMS = `Tu código de verificación en SERVIPRO es: ${codigo}`;

        // Enviamos el SMS real con Twilio
        await sendSMS(telefono, mensajeSMS);

        // Usamos logger.info en lugar de console.log
        logger.info(`Código enviado a ${telefono}: ${codigo}`);

        // Respondemos al frontend
        return res.json({
            mensaje: "Código de verificación enviado por SMS."
        });

    } catch (err) {
        // Usamos logger.error en lugar de console.error
        logger.error(`Error en /auth/register: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// POST /auth/verify
// Endpoint que verifica el código ingresado por el prestador.
//
// Qué hace:
// - Recibe teléfono y código.
// - Busca el usuario en base de datos.
// - Verifica si el código coincide y no está vencido.
// - Si está todo bien:
//    - Marca el usuario como verificado.
//    - Borra el código.
//    - Genera un token JWT para autenticarlo.
//
// Ejemplo request:
// POST /auth/verify
// {
//   "telefono": "+34123456789",
//   "codigo": "426731"
// }
///////////////////////////////////////////////////////////////////////////////////////

router.post("/verify", async (req, res) => {
    try {
        // Definimos el esquema Joi para validar el input
        const schema = Joi.object({
            // Usamos nuestro nuevo esquema
            telefono: telefonoSchema,
            codigo: Joi.string().length(6).required()
        });

        // Validamos los datos recibidos
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { telefono, codigo } = req.body;

        // Buscamos el usuario por teléfono
        const user = await User.findOne({ telefono });

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // Verificamos si el código coincide
        if (user.codigoVerificacion !== codigo) {
            return res.status(400).json({ error: "Código incorrecto." });
        }

        // Verificamos si el código está vencido
        if (user.codigoExpira < new Date()) {
            return res.status(400).json({ error: "El código ha expirado." });
        }

        // Marcamos el usuario como verificado
        user.verificado = true;

        // Borramos el código para que no pueda usarse de nuevo
        user.codigoVerificacion = null;
        user.codigoExpira = null;

        await user.save();

        // Creamos el payload para el JWT
        const payload = {
            userId: user._id,
            telefono: user.telefono,
            verificado: user.verificado,
            role: "user"
        };

        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: jwtExpiresIn }
        );

        // Usamos logger.info en lugar de console.log
        logger.info(`Usuario ${telefono} verificado y JWT emitido.`);

        // Respondemos al frontend con el token
        return res.json({
            mensaje: "Teléfono verificado correctamente.",
            token
        });

    } catch (err) {
        // Usamos logger.error en lugar de console.error
        logger.error(`Error en /auth/verify: ${err.message}`);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// DELETE /auth/cleanup
//
// Qué hace:
// Endpoint para limpieza de la base de datos.
//
// - Busca usuarios cuyo código de verificación ya venció.
// - Borra los campos:
//    - codigoVerificacion
//    - codigoExpira
// - Devuelve cuántos usuarios fueron limpiados.
//
// Por qué es importante:
// Mantiene la base de datos limpia y liviana.
// Elimina datos innecesarios y caducos.
// Buenas prácticas de mantenimiento.
//
// Ejemplo request:
// DELETE /auth/cleanup
///////////////////////////////////////////////////////////////////////////////////////

router.delete("/cleanup", async (req, res) => {
    try {
        const result = await User.updateMany(
            { codigoExpira: { $lt: new Date() } },
            {
                $unset: {
                    codigoVerificacion: "",
                    codigoExpira: ""
                }
            }
        );

        // Usamos logger.info en lugar de console.log
        logger.info(`Cleanup ejecutado. Usuarios modificados: ${result.modifiedCount}`);

        return res.json({
            success: true,
            message: `Códigos expirados eliminados.`,
            usuariosLimpiados: result.modifiedCount
        });

    } catch (err) {
        // Usamos logger.error en lugar de console.error
        logger.error(`Error en /auth/cleanup: ${err.message}`);
        return res.status(500).json({ error: "Error interno al limpiar códigos expirados." });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el router para que pueda integrarse en index.js
///////////////////////////////////////////////////////////////////////////////////////

module.exports = router;

///////////////////////////////////////////////////////////////////////////////////////
// Gracias a este archivo:
// Tenemos flujo completo de registro y login solo con SMS.
// Los prestadores están protegidos con JWT.
// Todo el proceso está validado y es seguro.
// Estamos listos para proteger rutas privadas en el backend.
// Limpieza automática de códigos expirados,
// manteniendo nuestra base de datos optimizada y ordenada.
// Validación estricta del teléfono en formato internacional.
// JWT incluye más datos para el frontend.
// Logs profesionales con Winston,
// para máxima trazabilidad y mantenimiento.
///////////////////////////////////////////////////////////////////////////////////////
*/
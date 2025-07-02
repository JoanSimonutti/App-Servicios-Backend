///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo sendSMS.js?
// Basicamente es la pieza clave para hacer nuestro login con SMS.

// Este archivo define una función de utilidad llamada sendSMS que se encarga de:
// Conectarse con Twilio usando sus credenciales.
// Enviar un SMS real a cualquier número válido.
// Manejar errores y loguear problemas.

// Es un módulo totalmente independiente y reutilizable en:
// - Registro de prestadores.
// - Login por SMS.
// - Envío de alertas o notificaciones futuras.

// Gracias a este archivo, cualquier parte de nuestra app puede enviar SMS
// de forma profesional y segura.

// ➡ Variables sensibles como SID, token y número de Twilio se cargan desde .env
// para mantener la seguridad y poder cambiarlas sin tocar código.
///////////////////////////////////////////////////////////////////////////////////////

// Importamos el SDK oficial de Twilio para Node.js
const twilio = require("twilio");

// Importamos dotenv para asegurarnos de tener las variables de entorno cargadas.
// Aunque probablemente ya se cargaron en index.js, lo dejamos acá por seguridad
// en caso de que se use este módulo de forma independiente.
require("dotenv").config();

///////////////////////////////////////////////////////////////////////////////////////
// Configuración de Twilio
// Creamos el cliente Twilio usando credenciales secretas.
// Estos valores se obtienen de nuestro archivo .env, por seguridad.
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,   // SID de cuenta Twilio
    process.env.TWILIO_AUTH_TOKEN     // Token de autenticación Twilio
);

///////////////////////////////////////////////////////////////////////////////////////
// Definimos la función sendSMS
///////////////////////////////////////////////////////////////////////////////////////

/**
 * Envía un SMS a un número de teléfono usando Twilio.
 *
 * @param {string} to - Número de teléfono destinatario en formato internacional (e.g. +34123456789)
 * @param {string} message - Texto que queremos enviar por SMS
 * @returns {Promise<object>} - Retorna el objeto de respuesta de Twilio si todo sale bien
 *
 * Ejemplo de uso:
 * await sendSMS("+34123456789", "Tu código es 123456");
 */
async function sendSMS(to, message) {
    try {
        // Creamos el mensaje SMS usando la API de Twilio
        const result = await client.messages.create({
            body: message,                   // Texto del SMS
            from: process.env.TWILIO_PHONE_NUMBER, // Número verificado en Twilio desde el cual se envía el SMS
            to                                // Número de destino
        });

        // Mostramos en consola que el mensaje se envió correctamente
        console.log(`SMS enviado a ${to}. SID del mensaje: ${result.sid}`);

        // Devolvemos el objeto completo devuelto por Twilio (puede ser útil para logs)
        return result;

    } catch (error) {
        // Si ocurre algún error, lo mostramos de forma profesional
        console.error("Error al enviar SMS con Twilio:", error);

        // Podríamos decidir si lanzamos el error para que lo maneje el caller,
        // o simplemente devolver un valor falso. En producción suele ser mejor
        // propagar el error para saber que algo falló.
        throw new Error("No se pudo enviar el SMS.");
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos la función para que pueda usarse en cualquier parte del backend
///////////////////////////////////////////////////////////////////////////////////////

module.exports = sendSMS;

///////////////////////////////////////////////////////////////////////////////////////
// Gracias a este archivo: 
// Tenemos integración real con Twilio.
// Podés enviar SMS a cualquier prestador de forma segura.
// El backend queda desacoplado de Twilio → solo llamamos a sendSMS.
// Está listo para producción, con manejo profesional de errores.
///////////////////////////////////////////////////////////////////////////////////////

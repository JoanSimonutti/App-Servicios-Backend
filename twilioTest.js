///////////////////////////////////////////////////////////////////////////////////////
// twilioTest.js
// Este archivo sirve para enviar un SMS de prueba usando Twilio.
///////////////////////////////////////////////////////////////////////////////////////

// Importamos dotenv para leer el archivo .env
require("dotenv").config();

const twilio = require("twilio");

// Creamos el cliente Twilio con tus credenciales
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Definimos un async para poder usar await
async function sendTestSMS() {
    try {
        const result = await client.messages.create({
            body: "¡Hola! Este es un SMS de prueba enviado desde el backend de SERVIPRO. Dejale saludos al chancho peludo.",
            from: process.env.TWILIO_PHONE_NUMBER,
            to: "+34..." // Agregar número de destino.
        });

        console.log("SMS enviado con éxito:");
        console.log("SID del mensaje:", result.sid);
        console.log("Estado inicial:", result.status);
        console.log("Precio (si está disponible):", result.price);

    } catch (err) {
        console.error("Error al enviar el SMS:", err);
    }
}

// Ejecutamos la función
sendTestSMS();

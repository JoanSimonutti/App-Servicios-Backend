///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace db.js?
// Este archivo define y exporta una función llamada connectDB que se encarga de:
// Conectarse a la base de datos MongoDB Atlas usando la URI provista en el archivo .env.
// Detectar si la conexión falla y mostrar un mensaje de error en consola.
// Finalizar la ejecución si no se puede conectar, para evitar que el servidor quede corriendo sin acceso a la base.

// ¿Por qué es importante?
// Porque si no hay conexión a la base de datos, toda la app deja de tener sentido: no podés crear ni consultar servicios.
// Separar la lógica de conexión en este archivo permite modularidad y mantenimiento: cualquier cambio en la forma de conectarse se hace en un solo lugar.

// ¿Qué ganás con esto?
// Control total sobre la conexión: configurás cómo y cuándo se conecta tu app.
// Manejo profesional de errores: mensajes claros, detención del servidor solo si es necesario.
// Escalabilidad: podés extender esta función para agregar reconexión automática, logs externos, o métricas.

// Este archivo es esencial para la salud y estabilidad de nuestro backend.
///////////////////////////////////////////////////////////////////////////////////////

// Este módulo se encarga de conectar la aplicación a la base de datos MongoDB Atlas usando Mongoose.
const mongoose = require("mongoose");

// Función asíncrona para conectar a MongoDB (la base de datos)
const connectDB = async () => {
    try {
        // Conexión directa usando la URI de entorno. Las opciones ya no son necesarias desde Mongoose v6.
        await mongoose.connect(process.env.MONGO_URI);

        // Si la conexión es exitosa, mostramos un mensaje en consola
        console.log("Conectado correctamente a MongoDB Atlas");
    } catch (err) {
        // Si ocurre un error, lo mostramos con un mensaje claro
        console.error("Error al conectar a MongoDB:", err.message);

        // Finalizamos el proceso con un código de error (1) solo si es crítico
        process.exit(1);
    }
};

// Exportamos esta función para que pueda usarse en server.js
module.exports = connectDB;

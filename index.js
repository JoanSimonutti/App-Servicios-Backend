///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace api/index.js?
// Este archivo es el punto de entrada principal de tu backend. 
// Su función es:
// Crear la instancia del servidor Express.
// Configurar middlewares para lectura de JSON y manejo de CORS.
// Cargar las variables de entorno.
// Conectar con la base de datos MongoDB.
// Enrutar todas las peticiones hacia los archivos de rutas (en este caso, /api/services).
// Arrancar el servidor y dejarlo escuchando en el puerto definido.

// ¿Por qué es importante?
// Porque sin este archivo, la app no inicia.
// Es el primer archivo que se ejecuta y el que monta y organiza toda la arquitectura.
// Si algo falla acá (como la conexión a MongoDB o una mala configuración), la app entera no arranca.

// Con este archivo ganás:
// Seguridad: con helmet protegés contra vulnerabilidades comunes.
// Rendimiento: compression reduce el tamaño de las respuestas.
// Monitoreo: morgan muestra qué peticiones llegan (muy útil en desarrollo).
// Robustez: manejo correcto de rutas inválidas y errores inesperados.
// Escalabilidad: estructura clara, preparada para crecer.
///////////////////////////////////////////////////////////////////////////////////////

// Punto de entrada principal del backend. Aquí se inicializa el servidor Express,
// se conectan los middlewares, la base de datos y se definen las rutas de la API.
// Importamos módulos necesarios
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");

// Cargamos variables de entorno desde /api/.env si está en local
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./db");
const serviceRoutes = require("./routes/services");
const clickRoutes = require("./routes/clicks");

// Creamos la app de Express
const app = express();

// Conectamos con MongoDB solo una vez
connectDB();

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Rutas principales
app.use("/api/services", serviceRoutes);
app.use("/api/clicks", clickRoutes);

// Ruta raíz para prueba
app.get("/", (req, res) => {
    res.send("API de Servicios funcionando en Vercel Serverless");
});

// Middleware 404
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware de errores
app.use((err, req, res, next) => {
    console.error("Error inesperado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// Exportamos el handler que Vercel usará
module.exports = serverless(app);

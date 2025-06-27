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
///////////////////////////////////////////////////////////////////////////////////////
// index.js – Punto de entrada principal del backend en Render
// Inicializa Express, configura seguridad, middleware, rutas y lanza el servidor.
///////////////////////////////////////////////////////////////////////////////////////

// Importamos los módulos necesarios
const express = require("express");          // Framework web principal
const cors = require("cors");                // Permite llamadas desde otros dominios (CORS)
const helmet = require("helmet");            // Seguridad por cabeceras HTTP
const compression = require("compression");  // Comprime respuestas HTTP (mejora rendimiento)
const morgan = require("morgan");            // Middleware de logging
const dotenv = require("dotenv");            // Carga variables de entorno desde .env
const path = require("path");                // Módulo nativo de Node para rutas de archivos

// Cargamos variables de entorno desde /api/.env si está en desarrollo local
dotenv.config({ path: path.join(__dirname, ".env") });

// Importamos conexión a la base de datos y rutas
const connectDB = require("./db");
const serviceRoutes = require("./routes/services");
const clickRoutes = require("./routes/clicks");

// Creamos la instancia de Express
const app = express();

// Conectamos a MongoDB (una sola vez)
connectDB();

// Aplicamos middlewares globales
app.use(helmet());                 // Seguridad HTTP
app.use(compression());           // Comprimir respuestas
app.use(cors());                  // Permitir CORS
app.use(morgan("dev"));           // Logs de peticiones
app.use(express.json());          // Parsear JSON en requests

// Rutas principales de la API
app.use("/services", serviceRoutes);
app.use("/clicks", clickRoutes);

// Ruta base de prueba
app.get("/", (req, res) => {
    res.send("Backend de App-Servicios iniciado correctamente");
});

// Middleware 404 (ruta no encontrada)
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error("Error inesperado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// Obtenemos el puerto desde las variables de entorno (Render lo asigna automáticamente)
const PORT = process.env.PORT || 10000;

// Iniciamos el servidor y lo dejamos escuchando
app.listen(PORT, () => {
    console.log(`Backend escuchando en puerto ${PORT}`);
});

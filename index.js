///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace api/index.js?
// Este archivo es el punto de entrada principal de tu backend.
//
// Su función es:
// Crear la instancia del servidor Express.
// Configurar middlewares para lectura de JSON y manejo de CORS.
// Cargar las variables de entorno.
// Conectar con la base de datos MongoDB.
// Enrutar todas las peticiones hacia los archivos de rutas (en este caso, /api/services).
// Arrancar el servidor y dejarlo escuchando en el puerto definido.
//
// ¿Por qué es importante?
// Porque sin este archivo, la app no inicia.
// Es el primer archivo que se ejecuta y el que monta y organiza toda la arquitectura.
// Si algo falla acá (como la conexión a MongoDB o una mala configuración), la app entera no arranca.
//
// Con este archivo ganás:
// Seguridad: con helmet protegés contra vulnerabilidades comunes.
// Rendimiento: compression reduce el tamaño de las respuestas.
// Monitoreo: morgan muestra qué peticiones llegan (muy útil en desarrollo).
// Robustez: manejo correcto de rutas inválidas y errores inesperados.
// Escalabilidad: estructura clara, preparada para crecer.
///////////////////////////////////////////////////////////////////////////////////////
// Aquí se inicializa el servidor Express, se conectan los middlewares, la base de datos
// y se definen las rutas de la API.
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

///////////////////////////////////////////////////////////////////////////////////////
// AGREGADO NUEVO → Rate Limiting
// Qué es:
// Evita que una misma IP haga demasiadas peticiones en poco tiempo a rutas sensibles
// como /auth, protegiendo el backend contra bots o ataques de fuerza bruta.
//
// Por qué es importante:
// - Evita costos innecesarios en Twilio (por SMS masivos).
// - Protege el backend de abusos.
// - Da robustez a la seguridad general.
//
// En este caso configuramos:
// Máximo 4 requests por IP cada 60 minutos a cualquier ruta que empiece con /auth.
// Implementado con express-rate-limit.
///////////////////////////////////////////////////////////////////////////////////////

const rateLimit = require("express-rate-limit");    // Importamos la librería express-rate-limit

// Configuramos el limitador para rutas /auth
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // Ventana de tiempo → 60 minutos expresados en milisegundos
    max: 4,                    // Máximo 4 requests permitidos por IP en esa ventana de tiempo
    message: {
        success: false,
        message: "Has superado el límite de solicitudes. Intentá nuevamente más tarde."
    },
    standardHeaders: true,     // Devuelve cabeceras estándar como RateLimit-Limit, etc.
    legacyHeaders: false       // No devuelve cabeceras obsoletas (X-RateLimit-...)
});

// Importamos librerías para autenticación
const authRoutes = require("./routes/auth");              // Rutas de autenticación
const authMiddleware = require("./middleware/authMiddleware"); // Middleware para proteger rutas privadas

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
app.use(helmet());          // Seguridad HTTP
app.use(compression());     // Comprimir respuestas
app.use(cors());            // Permitir CORS
app.use(morgan("dev"));     // Logs de peticiones
app.use(express.json());    // Parsear JSON en requests

// Rutas principales de la API
app.use("/serv", serviceRoutes); // https://app-servicios-backend.onrender.com/serv (solo 4 letras para cometer menos errores de tipeo, pero)
app.use("/clic", clickRoutes);   // https://app-servicios-backend.onrender.com/clic (si en un futuro la app crece y necesitamos modificar las rutas lo hacemos)

///////////////////////////////////////////////////////////////////////////////////////
// Aplicar Rate Limiting a /auth
//
// Esto significa:
// Antes de entrar a cualquiera de las rutas /auth (por ejemplo /auth/register o /auth/verify),
// se aplicará el rate limiter configurado.
//
// Si un cliente supera las 4 peticiones en 60 minutos, recibirá:
// HTTP 429 Too Many Requests
// {
//   success: false,
//   message: "Has superado el límite de solicitudes. Intentá nuevamente más tarde."
// }
//
// Esto no afecta a ninguna otra ruta fuera de /auth.
//
///////////////////////////////////////////////////////////////////////////////////////

app.use("/auth", authLimiter);

///////////////////////////////////////////////////////////////////////////////////////
// FIN AGREGADO NUEVO → Aplicar Rate Limiting a /auth
///////////////////////////////////////////////////////////////////////////////////////

// Rutas de autenticación
app.use("/auth", authRoutes);    // https://app-servicios-backend.onrender.com/auth

///////////////////////////////////////////////////////////////////////////////////////
// Ejemplo de ruta privada protegida por JWT

// Esta ruta solo podrá ser accedida si el cliente envía correctamente
// un token JWT válido en el header Authorization.

// Ejemplo de cómo consumirla:
// GET /privado
// Authorization: Bearer <token>
///////////////////////////////////////////////////////////////////////////////////////

app.get("/privado", authMiddleware, (req, res) => {
    res.json({
        mensaje: "Accediste a una ruta privada con éxito.",
        usuario: req.user
    });
});

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

///////////////////////////////////////////////////////////////////////////////////////
// ENDPOINTS para Servicios:
// GET /serv
// POST /serv
// GET /serv/:id
// PUT /serv/:id
// DELETE /serv/:id

// ENDPOINTS para Clicks:
// GET /clic
// POST /clic

// ENDPOINTS para autenticación:
// POST /auth/register → para solicitar el SMS de verificación
// POST /auth/verify   → para verificar el código y recibir el JWT
//
// Ruta privada de ejemplo:
// GET /privado (protegida con JWT)
///////////////////////////////////////////////////////////////////////////////////////

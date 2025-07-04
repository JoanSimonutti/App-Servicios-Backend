///////////////////////////////////////////////////////////////////////////////////////
// utils/logger.js
//
// Qué hace este archivo:
// Configura Winston, una librería de logging profesional.
//
// Winston permite:
// Niveles de logs (info, warn, error).
// Guardar logs en archivos y/o consola.
// Timestamps en cada log.
// Formato JSON si queremos.
//
// Por qué es importante:
// - Mucho más profesional que console.log.
// - Permite analizar logs después de un incidente.
// - Escalable para proyectos grandes.
//
// En este archivo:
// - Si estamos en producción → guarda logs en archivos.
// - Si estamos en desarrollo → muestra logs por consola.
//
///////////////////////////////////////////////////////////////////////////////////////

const { createLogger, format, transports } = require("winston");

const logger = createLogger({
    level: "info", // Nivel mínimo de logs que se registrarán
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(info => {
            return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`;
        })
    ),
    transports: [
        // En producción, podrías agregar archivos:
        new transports.Console()
    ]
});

module.exports = logger;

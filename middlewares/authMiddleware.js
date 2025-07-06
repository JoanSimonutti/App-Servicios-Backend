///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo authMiddleware.js?

// Este archivo define un middleware llamado authMiddleware que:
// Verifica si el request trae un token JWT válido.
// Decodifica el token y lo adjunta al objeto req.user.
// Bloquea el acceso si el token falta o es inválido.

// Gracias a esto:
// - Solo prestadores autenticados pueden acceder a rutas privadas.
// - Protegemos la app de accesos no autorizados.
// - Mantenemos la seguridad y privacidad de los datos.
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
// Importamos librerías necesarias
///////////////////////////////////////////////////////////////////////////////////////

const jwt = require("jsonwebtoken"); // Librería oficial de JSON Web Tokens

///////////////////////////////////////////////////////////////////////////////////////
// Definimos el middleware authMiddleware
///////////////////////////////////////////////////////////////////////////////////////

/**
 * Middleware que protege rutas privadas.
 *
 * Si el token JWT es válido:
 *   - decodifica su contenido
 *   - lo coloca en req.user
 *   - permite que la ruta continúe
 *
 * Si el token es inválido o está ausente:
 *   - devuelve error 401 (no autorizado)
 *
 * Se debe usar en rutas privadas así:
 *
 * app.get("/ruta-privada", authMiddleware, (req, res) => { ... });
 *
 */
function authMiddleware(req, res, next) {
    try {
        // Extraemos el header Authorization
        // Esperamos un header así:
        // Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // Si falta el header o no empieza con "Bearer ", bloqueamos acceso
            return res.status(401).json({ error: "Acceso no autorizado. Token faltante." });
        }

        // Extraemos solo el token, quitando la palabra "Bearer "
        const token = authHeader.split(" ")[1];

        // Verificamos y decodificamos el token con nuestra clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Guardamos los datos decodificados en req.user para usarlos en la ruta
        //
        // decoded contendrá:
        // {
        //   userId: "...",
        //   telefono: "+34123456789",
        //   iat: ...,    // fecha de emisión
        //   exp: ...     // fecha de expiración
        // }
        req.user = decoded;

        // Si está todo bien → dejamos continuar a la siguiente función (ruta privada)
        next();

    } catch (err) {
        console.error("Error en authMiddleware:", err);
        return res.status(401).json({ error: "Token inválido o expirado." });
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el middleware para usarlo en cualquier ruta privada
///////////////////////////////////////////////////////////////////////////////////////

module.exports = authMiddleware;

///////////////////////////////////////////////////////////////////////////////////////
// Resultado
///////////////////////////////////////////////////////////////////////////////////////
// Gracias a este archivo:
// Tenemos rutas privadas seguras.
// Prestadores sin login no pueden acceder a datos sensibles.
// req.user queda disponible con datos del token.
// Nuestra app se mantiene protegida y profesional.
///////////////////////////////////////////////////////////////////////////////////////
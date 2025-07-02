///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo user.js?
// Este archivo define el modelo de datos "User", que representa a cada prestador de
// servicios como un usuario autenticado en la aplicación.

// Su propósito es:
// - Registrar a los prestadores con su número de teléfono.
// - Manejar la lógica de verificación por SMS (código y expiración).
// - Guardar el estado de verificación (true o false).
// - Permitir autenticación segura vía JWT una vez verificado.

// Con este modelo logramos:
// Seguridad: solo prestadores legítimos pueden acceder a funciones privadas.
// Integridad: los datos del prestador quedan bien validados.
// Escalabilidad: está preparado para futuros campos (p. ej. email, permisos).
// Mantenibilidad: cualquier desarrollador puede entender el modelo y trabajar sobre él.

// IMPORTANTE:
// - Este modelo NO guarda contraseñas porque decidimos implementar auth solo vía SMS.
// - El campo teléfono es ÚNICO: es el dato clave de identidad del prestador.
///////////////////////////////////////////////////////////////////////////////////////

const mongoose = require("mongoose"); // Importamos mongoose para definir el esquema.

///////////////////////////////////////////////////////////////////////////////////////
// Definimos el esquema del User
///////////////////////////////////////////////////////////////////////////////////////

const userSchema = new mongoose.Schema({

    // Teléfono del prestador.
    // Es el campo CLAVE que identifica a cada prestador.
    // Solo se permiten números (con posible "+" al inicio) para formatos internacionales.
    // Debe ser único para que no existan duplicados.
    // Indexado para búsquedas rápidas.
    telefono: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: function (v) {
                // Validamos que sea un teléfono internacional válido (7 a 15 dígitos).
                return /^\+?\d{7,15}$/.test(v);
            },
            message: props => `${props.value} no es un número de teléfono válido.`
        }
    },

    // Código de verificación enviado por SMS.
    // Se genera automáticamente en el backend cuando el prestador se registra o
    // solicita login.
    // Nunca debería ser expuesto públicamente.
    // Se elimina (null) una vez que el usuario verifica su teléfono correctamente.
    codigoVerificacion: {
        type: String,
        default: null
    },

    // Fecha y hora en la que expira el código de verificación.
    // Permite que el código solo sea válido durante unos minutos (p. ej. 10 minutos).
    // Si está en el pasado, el código ya no es válido.
    codigoExpira: {
        type: Date,
        default: null
    },

    // Indica si el teléfono del prestador fue verificado correctamente.
    // Solo un prestador verificado podrá recibir JWT y acceder a rutas privadas.
    // Hasta que sea true, no puede loguearse ni operar.
    verificado: {
        type: Boolean,
        default: false
    }

}, {
    // timestamps genera automáticamente los campos:
    // - createdAt → cuándo se creó el documento.
    // - updatedAt → cuándo se actualizó por última vez.
    timestamps: true
});

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el modelo llamado "User" para que pueda ser usado en todo el backend.
// Este modelo es la piedra fundamental de la autenticación de prestadores vía SMS.
///////////////////////////////////////////////////////////////////////////////////////

module.exports = mongoose.model("User", userSchema);

///////////////////////////////////////////////////////////////////////////////////////
// Resultado:
// Garantizamos que solo números válidos de teléfono se registran en la app.
// Mantenemos la seguridad de los códigos de verificación (no quedan expuestos).
// Podemos saber si un prestador está o no verificado.
// Construimos una base robusta para JWT y autenticación segura.

// Con este modelo, estamos listos para implementar toda la lógica de:
// - envío de SMS con Twilio.
// - verificación de códigos.
// - emisión de tokens JWT para los prestadores.
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo click.js?
// Este archivo define el modelo de datos "Click", que registra cada vez que un usuario 
// hace clic en el botón de WhatsApp o Teléfono de un prestador de servicios.
//
// Nos permite guardar, analizar y contar los clics que recibe cada servicio, 
// para que el administrador (vos pedazo de soquete) sepa cuánto tráfico real está teniendo cada perfil.
//
// Esto habilita funcionalidades como:
// - Saber cuántas veces fue contactado un prestador.
// - Diferenciar entre clics de WhatsApp y de Teléfono.
// - Generar estadísticas por día, semana o mes.
//
// Es una herramienta de analítica que podés aprovechar para evaluar el rendimiento 
// de cada prestador y tomar decisiones comerciales o estratégicas.
///////////////////////////////////////////////////////////////////////////////////////

const mongoose = require("mongoose"); // Usamos Mongoose para definir el modelo

// Creamos el esquema de "Click", que define la estructura de cada documento guardado
const clickSchema = new mongoose.Schema({

    // ID del prestador de servicios al que se le hizo clic
    serviceId: {
        type: mongoose.Schema.Types.ObjectId, // Es una referencia a la colección Service
        required: true,
        ref: "Service"
    },

    // Tipo de clic realizado: puede ser "telefono" o "whatsapp"
    tipo: {
        type: String,
        required: true,
        enum: ["telefono", "whatsapp"] // Solo aceptamos estos dos valores
    },

    // Fecha y hora en que se hizo el clic. Por defecto: ahora.
    fecha: {
        type: Date,
        default: Date.now
    }

}, {
    // Activamos timestamps automáticos: createdAt y updatedAt
    timestamps: true
});

// Exportamos el modelo llamado "Click" para que pueda ser usado en toda la app
module.exports = mongoose.model("Click", clickSchema);


///////////////////////////////////////////////////////////////////////////////////////
// Resultado
///////////////////////////////////////////////////////////////////////////////////////
// Este modelo es el que permite registrar y analizar la interacción de los usuarios
// con los prestadores de servicios.
//
// Cada vez que un visitante hace clic en "WhatsApp" o "Teléfono", guardamos ese evento
// con hora, tipo e ID del servicio, permitiendo monitoreo real de tráfico.
//
// Es la base para crear estadísticas, gráficos y reportes más adelante.
///////////////////////////////////////////////////////////////////////////////////////

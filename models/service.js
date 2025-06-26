///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo service.js?
// Este archivo define el modelo de datos Service que representa a cada prestador de servicios dentro de la aplicación. 
// Su función principal es establecer la estructura, las validaciones y las reglas que deben cumplir todos los documentos que se guardan en la base de datos MongoDB. 
// A través de este esquema, el backend puede crear, leer, actualizar y eliminar servicios con seguridad y consistencia.
// Es una pieza clave del backend porque garantiza que todos los datos almacenados estén bien formados, tengan los valores adecuados y sigan las reglas de negocio definidas. 
// Sin este modelo, la base de datos aceptaría cualquier dato sin control, lo que afectaría la calidad, confiabilidad y seguridad de toda la aplicación.
// En resumen, este archivo es el corazón estructural de la información en la app: 
// define cómo es un servicio, cómo debe lucir, qué datos son válidos y cómo deben validarse antes de ser guardados.
///////////////////////////////////////////////////////////////////////////////////////

// Importamos el módulo 'mongoose', que es la herramienta principal para definir esquemas y modelos con MongoDB
const mongoose = require("mongoose");

// Creamos un esquema que define la estructura de cada documento en la colección 'services'
// Cada campo está validado para asegurar integridad y calidad de datos

// Definimos el esquema del servicio
const serviceSchema = new mongoose.Schema({

    // Nombre del prestador. Requerido, con validación de formato y búsqueda optimizada (indexado)
    nombre: {
        type: String,
        required: true,
        index: true,
        minlength: 3,
        maxlength: 100,
        validate: {
            // Permitimos solo letras (mayúsculas y minúsculas), acentos y espacios
            validator: function (v) {
                return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(v);
            },
            message: props => `${props.value} no es un nombre válido`
        }
    },

    // Teléfono de contacto. Solo se aceptan números, con posible "+" al inicio (formato internacional)
    telefono: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\+?\d{7,15}$/.test(v); // de 7 a 15 dígitos
            },
            message: props => `${props.value} no es un número de teléfono válido`
        }
    },

    // Categoría del servicio. Solo se aceptan los valores definidos en el "enum". Indexado para búsquedas.
    categoria: {
        type: String,
        required: true,
        enum: [
            "Plomería",
            "Electricidad",
            "Herrería",
            "Carpintería",
            "Gas",
            "Informática",
            "Enfermería",
            "Limpieza",
            "Pastelería",
            "Huevos de Gallina",
        ],
        index: true
    },

    // Descripción breve del tipo de servicio ofrecido. Validado por longitud mínima y máxima. Indexado.
    tipoServicio: {
        type: String,
        required: true,
        index: true,
        minlength: 5,
        maxlength: 150
    },

    // Localidad donde trabaja el prestador. Validamos tamaño mínimo y máximo. Indexado para búsquedas.
    localidad: {
        type: String,
        required: true,
        index: true,
        minlength: 2,
        maxlength: 100
    },

    // Hora en la que comienza a trabajar. Número entre 0 y 23.
    horaDesde: {
        type: Number,
        required: true,
        min: 0,
        max: 23
    },

    // Hora en la que termina de trabajar. Número entre 0 y 23. Debe ser mayor que horaDesde.
    horaHasta: {
        type: Number,
        required: true,
        min: 0,
        max: 23,
        validate: {
            // Validamos que la hora final sea mayor que la inicial
            validator: function (v) {
                return v > this.horaDesde;
            },
            message: props => `horaHasta (${props.value}) debe ser mayor que horaDesde (${props.instance.horaDesde})`
        }
    },

    // Indica si ofrece servicios de urgencias 24hs. Valor booleano.
    urgencias24hs: {
        type: Boolean,
        default: false
    },

    // Indica si trabaja en localidades cercanas. Valor booleano.
    localidadesCercanas: {
        type: Boolean,
        default: false
    },

    // URL pública de la imagen del prestador. Validamos que sea una URL de imagen válida.
    fotoUrl: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/.test(v);
            },
            message: props => `La URL ${props.value} no es válida para una imagen`
        }
    }

}, {
    // Agregamos timestamps automáticos: createdAt y updatedAt
    timestamps: true
});

// Exportamos el modelo llamado 'Service' para que pueda ser usado en toda la app
module.exports = mongoose.model("Service", serviceSchema);


///////////////////////////////////////////////////////////////////////////////////////
// Resultado
///////////////////////////////////////////////////////////////////////////////////////
// El modelo service.js ya no es solo una definición de datos: 
// es una capa sólida de protección, claridad y organización 
// que garantiza que el backend trabaje con información limpia, precisa y validada. 
// Es una base profesional para una app estable y lista para producción real.

///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué implementamos en service.js?
///////////////////////////////////////////////////////////////////////////////////////
// Validaciones avanzadas con Mongoose:
// Formato de nombre (solo letras y espacios)
// Teléfono con formato internacional (+ opcional)
// URL válida de imagen (fotoUrl)
// Lógica de horarios (horaHasta debe ser mayor que horaDesde)

// Estructura horaria dividida:
// horaDesde y horaHasta como números enteros (0 a 23)
// Preparado para futuros filtros de disponibilidad por hora

// Control de categorías:
// Campo categoria con lista enum fija
// Solo se aceptan valores válidos definidos por la app

// Validaciones de longitud:
// Mínimos y máximos en nombre, tipoServicio y localidad

// Indexación inteligente:
// Índices en nombre, categoria, tipoServicio y localidad
// Mejora el rendimiento de búsquedas y filtros complejos

// Timestamps automáticos:
// createdAt y updatedAt generados por Mongoose
// Útiles para métricas, ordenamientos, auditorías

// Comentarios detallados:
// Cada campo explicado línea por línea
// Ideal para otros desarrolladores, claridad total

///////////////////////////////////////////////////////////////////////////////////////
// ¿Por qué es necesario hacer todo esto?
///////////////////////////////////////////////////////////////////////////////////////
// Robustez: evitás que lleguen datos mal formateados o incoherentes a la base
// Seguridad: filtrás información inválida antes de que afecte al sistema
// Escalabilidad: podés manejar cientos o miles de servicios sin degradar el rendimiento
// Mantenimiento a largo plazo: cualquiera que lea el código puede entender y continuar el trabajo
// Control de calidad: no solo funciona, sino que funciona bien, con precisión y estructura


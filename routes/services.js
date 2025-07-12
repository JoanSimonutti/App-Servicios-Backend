///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo services.js?
// Este archivo define las rutas relacionadas con la gestión de servicios.
// Maneja las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los prestadores.
// Aplica validaciones con Joi, acceso a base de datos con Mongoose y control de errores profesional.
///////////////////////////////////////////////////////////////////////////////////////

const express = require("express"); // Framework web para Node.js
const router = express.Router(); // Sistema de rutas de Express
const Service = require("../models/service"); // Modelo de datos Service
const Joi = require("joi"); // Biblioteca de validación de datos
const NodeCache = require("node-cache"); // Biblioteca para cachear en memoria
const cache = new NodeCache({ stdTTL: 60 }); // TTL: 60 segundos

///////////////////////////////////////////////////////////////////////////////////////
// NUEVO:
// Definimos el listado completo de categorías válidas.
// Esto garantiza coherencia absoluta entre Joi y el enum del modelo Mongoose.
//
// Nota profesional:
// Idealmente, en el futuro, esto debería importarse desde un archivo único
// (p. ej. categoryGroups.js) para no duplicar listas de categorías en distintos lugares.
// Por ahora, lo mantenemos aquí para integrarlo de forma sencilla y rápida.
///////////////////////////////////////////////////////////////////////////////////////

const VALID_CATEGORIES = [
    // =========================================================
    // Servicios para el hogar
    // =========================================================
    "Plomería",
    "Electricidad",
    "Herrería",
    "Carpintería",
    "Gas",
    "Informática",
    "Limpieza doméstica",
    "Fumigación",
    "Reparaciones generales",
    "Climatización (aires, calefacción)",
    "Colocación de pisos / revestimientos",
    "Vidriería",
    "Impermeabilización",
    "Rejas y estructuras metálicas",
    "Colocación de cortinas",
    "Mantenimiento de piletas",
    "Armado de muebles",
    "Persianas y toldos",

    // =========================================================
    // Servicios para el cuidado de la familia
    // =========================================================
    "Enfermería",
    "Medicina a domicilio",
    "Niñeras",
    "Acompañante terapéutico",
    "Psicólogos",
    "Fonoaudiólogos",
    "Maestras particulares",
    "Kinesiología",
    "Terapias alternativas",
    "Psicopedagogía",
    "Fisioterapia",
    "Cuidadores de adultos mayores",
    "Acompañamiento escolar",
    "Logopedas",
    "Musicoterapia",
    "Asistencia escolar a domicilio",

    // =========================================================
    // Lavadero y mantenimiento
    // =========================================================
    "Lavadero de ropa",
    "Lavadero de coches",
    "Tintorerías",
    "Limpieza de alfombras y tapizados",
    "Limpieza industrial / comercial",
    "Lavado de sillones",
    "Limpieza de cortinas",
    "Servicios de planchado",
    "Lavado de colchones",
    "Limpieza post obra",
    "Limpieza de piletas",
    "Limpieza de vidrios en altura",
    "Lavado de tapizados de autos",
    "Limpieza de tanques de agua",

    // =========================================================
    // Profesionales y técnicos
    // =========================================================
    "Abogados",
    "Contadores",
    "Traductores",
    "Asesores impositivos",
    "Ingenieros",
    "Arquitectos",
    "Desarrolladores de software",
    "Diseñadores gráficos",
    "Marketing digital",
    "Reparadores de electrodomésticos",
    "Técnicos electrónicos",
    "Electricistas matriculados",
    "Gestores administrativos",
    "Técnicos en refrigeración",
    "Técnicos de PC",
    "Diseñadores industriales",
    "Auditores",
    "Consultores empresariales",
    "Gestoría vehicular",
    "Peritos",
    "Agrimensores",
    "Topógrafos",
    "Fotógrafos profesionales",

    // =========================================================
    // Eventos y entretenimiento
    // =========================================================
    "Fotografía y video de eventos",
    "Música en vivo",
    "Animadores infantiles",
    "Catering",
    "Decoradores",
    "Alquiler de livings y mobiliario",
    "Pastelería para eventos",
    "Organización de fiestas",
    "Sonido e iluminación",
    "Magos / shows",
    "Carpas y gazebos para eventos",
    "Bartenders",
    "Alquiler de vajilla",
    "Wedding planners",
    "Food trucks",
    "Animación para adultos",
    "Cotillón personalizado",
    "Escenografía para eventos",

    // =========================================================
    // Transporte y logística
    // =========================================================
    "Fletes",
    "Mudanzas",
    "Moto mensajería",
    "Chofer particular",
    "Transportes especiales",
    "Delivery de productos voluminosos",
    "Transporte de personas",
    "Transporte de mascotas",
    "Cargas refrigeradas",
    "Transporte escolar",
    "Courier internacional",
    "Alquiler de camionetas",
    "Chofer profesional para empresas",
    "Distribución de correspondencia",
    "Traslados corporativos",
    "Camiones con hidrogrúa",

    // =========================================================
    // Animales y mascotas
    // =========================================================
    "Paseadores de perros",
    "Peluquería canina / felina",
    "Adiestradores",
    "Veterinarios a domicilio",
    "Guarderías caninas",
    "Venta de alimentos y accesorios",
    "Educación canina",
    "Etología animal",
    "Adopciones responsables",
    "Fotografía de mascotas",
    "Hospedaje para mascotas",
    "Terapias alternativas animales",
    "Spa para mascotas",
    "Adiestramiento felino",

    // =========================================================
    // Estética
    // =========================================================
    "Peluquería hombre, mujer y niños",
    "Barberías",
    "Cosmetología",
    "Manicura / Pedicura",
    "Maquillaje profesional",
    "Depilación",
    "Masajes estéticos",
    "Spa a domicilio",
    "Estética corporal",
    "Tratamientos faciales",
    "Microblading",
    "Diseño de cejas",
    "Peinados para eventos",
    "Uñas esculpidas",
    "Extensiones de pestañas",
    "Micropigmentación",
    "Limpieza facial profunda",
    "Bronceado sin sol",
    "Diseño de sonrisa estética",

    // =========================================================
    // Categorías originales que ya existían
    // =========================================================
    "Pastelería",
    "Huevos de Gallina"
];

///////////////////////////////////////////////////////////////////////////////////////
// GET - Listado de todos los servicios
///////////////////////////////////////////////////////////////////////////////////////

router.get("/", async (req, res) => {
    try {
        // Validamos los parámetros de consulta para evitar datos basura
        const schema = Joi.object({
            categoria: Joi.string(),
            categorias: Joi.string(), // lista separada por coma
            tipoServicio: Joi.string(),
            tipoServicioLike: Joi.string(),
            nombre: Joi.string(),
            urgencias24hs: Joi.string().valid("true", "false"),
            localidadesCercanas: Joi.string().valid("true", "false"),
            localidad: Joi.string(), // nuevo filtro por localidad exacta
            hora: Joi.number().min(0).max(23),
            limit: Joi.number().min(1).max(100),
            skip: Joi.number().min(0),
            sort: Joi.string()
        });

        const { error } = schema.validate(req.query);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const filtro = {};

        if (req.query.categoria) filtro.categoria = req.query.categoria;

        if (req.query.categorias) {
            const categoriasArray = req.query.categorias.split(",");
            filtro.categoria = { $in: categoriasArray };
        }

        if (req.query.tipoServicio) filtro.tipoServicio = req.query.tipoServicio;

        if (req.query.tipoServicioLike) {
            filtro.tipoServicio = new RegExp(req.query.tipoServicioLike, "i");
        }

        if (req.query.nombre) filtro.nombre = new RegExp(req.query.nombre, "i");

        if (req.query.urgencias24hs === "true") filtro.urgencias24hs = true;
        if (req.query.urgencias24hs === "false") filtro.urgencias24hs = false;

        if (req.query.localidadesCercanas === "true") filtro.localidadesCercanas = true;
        if (req.query.localidadesCercanas === "false") filtro.localidadesCercanas = false;

        if (req.query.localidad) filtro.localidad = req.query.localidad;

        if (req.query.hora) {
            filtro.horaDesde = { $lte: req.query.hora };
            filtro.horaHasta = { $gt: req.query.hora };
        }

        const cacheKey = JSON.stringify({ filtro, limit: req.query.limit, skip: req.query.skip, sort: req.query.sort });
        const cacheResultado = cache.get(cacheKey);
        if (cacheResultado) return res.json(cacheResultado);

        let query = Service.find(filtro);

        if (req.query.limit) query = query.limit(Number(req.query.limit));
        if (req.query.skip) query = query.skip(Number(req.query.skip));
        if (req.query.sort) {
            const campos = req.query.sort.split(",").join(" ");
            query = query.sort(campos);
        }

        const resultado = await query.exec();
        cache.set(cacheKey, resultado);
        res.json(resultado);
    } catch (err) {
        console.error("Error al obtener servicios:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// GET - Obtener solo un servicio identificado por el ID
///////////////////////////////////////////////////////////////////////////////////////

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const servicio = await Service.findById(id);
        if (!servicio) {
            return res.status(404).json({ error: "Servicio no encontrado" });
        }

        res.json(servicio);
    } catch (err) {
        console.error("Error al obtener el servicio por ID:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// POST - Crear un nuevo servicio
///////////////////////////////////////////////////////////////////////////////////////

router.post("/", async (req, res) => {
    try {
        // NUEVO:
        // Integramos validación estricta para "categoria".
        const schemaPost = Joi.object({
            nombre: Joi.string().min(3).max(100).required(),
            telefono: Joi.string().pattern(/^\+?\d{7,15}$/).required(),
            categoria: Joi.string().valid(...VALID_CATEGORIES).required(), // NUEVO
            tipoServicio: Joi.string().min(5).max(150).required(),
            localidad: Joi.string().min(2).max(100).required(),
            horaDesde: Joi.number().min(0).max(23).required(),
            horaHasta: Joi.number().min(0).max(23).greater(Joi.ref("horaDesde")).required(),
            urgencias24hs: Joi.boolean().required(),
            localidadesCercanas: Joi.boolean().required(),
        });

        const { error } = schemaPost.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const nuevoServicio = new Service({
            nombre: req.body.nombre,
            telefono: req.body.telefono,
            categoria: req.body.categoria,
            tipoServicio: req.body.tipoServicio,
            localidad: req.body.localidad,
            horaDesde: req.body.horaDesde,
            horaHasta: req.body.horaHasta,
            urgencias24hs: req.body.urgencias24hs,
            localidadesCercanas: req.body.localidadesCercanas,
        });

        const resultado = await nuevoServicio.save();
        res.status(201).json(resultado);
    } catch (err) {
        console.error("Error al crear servicio:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// PUT - Actualizar un servicio existente
///////////////////////////////////////////////////////////////////////////////////////

router.put("/:id", async (req, res) => {
    try {
        const schemaPut = Joi.object({
            nombre: Joi.string().min(3).max(100),
            telefono: Joi.string().pattern(/^\+?\d{7,15}$/),
            categoria: Joi.string().valid(...VALID_CATEGORIES), // NUEVO
            tipoServicio: Joi.string().min(5).max(150),
            localidad: Joi.string().min(2).max(100),
            horaDesde: Joi.number().min(0).max(23),
            horaHasta: Joi.number().min(0).max(23).greater(Joi.ref("horaDesde")),
            urgencias24hs: Joi.boolean(),
            localidadesCercanas: Joi.boolean(),
        });

        const { error } = schemaPut.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const actualizado = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!actualizado) return res.status(404).json({ error: "Servicio no encontrado" });

        res.json(actualizado);
    } catch (err) {
        console.error("Error al actualizar servicio:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// DELETE - Eliminar un servicio
///////////////////////////////////////////////////////////////////////////////////////

router.delete("/:id", async (req, res) => {
    try {
        const eliminado = await Service.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ error: "Servicio no encontrado" });

        res.json({ mensaje: "Servicio eliminado con éxito" });
    } catch (err) {
        console.error("Error al eliminar servicio:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el router para usarlo en la app principal
///////////////////////////////////////////////////////////////////////////////////////

module.exports = router;

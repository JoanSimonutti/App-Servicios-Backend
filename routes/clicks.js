///////////////////////////////////////////////////////////////////////////////////////
// ¿Qué hace este archivo clicks.js?
// Define las rutas relacionadas con el registro y consulta de clics que los usuarios 
// hacen sobre los botones de contacto (WhatsApp o Teléfono) de los prestadores.
//
// Permite:
// - Registrar un nuevo clic (POST /api/clicks)
// - Consultar los clics hechos a un servicio (GET /api/clicks?serviceId=...)
//
// Esto brinda estadísticas y control real al administrador sobre el tráfico generado 
// por cada prestador de servicios.
///////////////////////////////////////////////////////////////////////////////////////

const express = require("express");            // Framework web para manejar rutas
const router = express.Router();               // Sistema de ruteo de Express
const Joi = require("joi");                    // Biblioteca de validación de datos
const Click = require("../models/click");      // Modelo de clics
const mongoose = require("mongoose");          // Para validar IDs de Mongo

///////////////////////////////////////////////////////////////////////////////////////
// POST /api/clicks - Registrar un clic
///////////////////////////////////////////////////////////////////////////////////////

router.post("/", async (req, res) => {
    try {
        // Definimos un esquema de validación con Joi
        const schema = Joi.object({
            serviceId: Joi.string().required(),                    // ID del prestador
            tipo: Joi.string().valid("telefono", "whatsapp").required() // Tipo de clic
        });

        // Validamos el cuerpo de la petición
        const { error } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        // Verificamos que el serviceId sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(req.body.serviceId)) {
            return res.status(400).json({ error: "serviceId inválido" });
        }

        // Creamos el documento del clic
        const nuevoClick = new Click({
            serviceId: req.body.serviceId,
            tipo: req.body.tipo
        });

        // Guardamos en la base de datos
        const resultado = await nuevoClick.save();

        // Devolvemos el clic registrado
        res.status(201).json(resultado);
    } catch (err) {
        console.error("Error al registrar clic:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// GET /api/clicks?serviceId=... - Obtener todos los clics de un prestador
///////////////////////////////////////////////////////////////////////////////////////

router.get("/", async (req, res) => {
    try {
        // Validamos que venga el parámetro serviceId (opcional por ahora)
        const { serviceId } = req.query;

        const filtro = {};
        if (serviceId) {
            // Validamos el formato de ObjectId
            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({ error: "serviceId inválido" });
            }
            filtro.serviceId = serviceId;
        }

        // Buscamos los clics en la base de datos
        const clicks = await Click.find(filtro).sort({ fecha: -1 }); // ordenados del más reciente

        res.json(clicks);
    } catch (err) {
        console.error("Error al obtener clics:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

///////////////////////////////////////////////////////////////////////////////////////
// Exportamos el router para usarlo en server.js
///////////////////////////////////////////////////////////////////////////////////////

module.exports = router;


///////////////////////////////////////////////////////////////////////////////////////
// Resultado
///////////////////////////////////////////////////////////////////////////////////////
// Este archivo permite:
// - Registrar cada vez que alguien hace clic en un botón de contacto (POST)
// - Consultar los clics para un servicio específico (GET)
//
// Con esto, el backend queda listo para registrar tráfico real generado por los prestadores.
// Ideal para métricas, estadísticas o control de rendimiento.
///////////////////////////////////////////////////////////////////////////////////////

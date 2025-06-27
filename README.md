## App-Servicios-Backend

- Backend profesional diseñado para gestionar un catálogo de prestadores de servicios y registrar interacciones de usuarios.

- Permite crear, almacenar, consultar, filtrar, modificar y eliminar perfiles de prestadores con toda su información.

### Tecnologías utilizadas:

- **Node.js**: Entorno de ejecución JavaScript del lado del servidor.
- **Express.js**: Framework web ligero para construir rutas y manejar peticiones HTTP.
- **MongoDB Atlas**: Base de datos NoSQL en la nube, usada para almacenar los servicios.
- **Mongoose**: ODM (Object Data Modeling) que permite modelar y validar documentos en MongoDB con esquemas.
- **dotenv**: Para manejar variables de entorno sensibles sin exponerlas en el código.
- **Joi**: Librería de validación de datos para entradas (GET, POST, PUT).
- **helmet**: Middleware de seguridad HTTP.
- **compression**: Middleware para comprimir las respuestas y mejorar el rendimiento.
- **morgan**: Middleware para loguear las peticiones HTTP en consola.
- **Node-Cache**: Sistema de cache en memoria para optimizar el rendimiento de las consultas GET a servicios.
- **cors**: Permite habilitar llamadas desde otros dominios (CORS).

## Funcionalidades implementadas

### CRUD de servicios (`/serv`)

- **GET** con filtros avanzados por:
  - Categoría.
  - Localidad.
  - Horario.
  - Urgencias 24hs.
  - Coincidencias parciales por nombre o tipo de servicio (filtros `nombre` y `tipoServicioLike`).
  - Paginación (`limit`, `skip`) y ordenamiento (`sort`).
- **POST** y **PUT** con validación estricta de estructura y formato.
- **DELETE** por ID.
- **Cache inteligente** de 60 segundos para consultas GET de /serv para reducir la carga de MongoDB.

### Registro de clics (`/clic`)

- Registra cuándo un usuario contacta a un prestador en WhatsApp o Teléfono.
- Guarda: ID del prestador, tipo de clic, fecha/hora.
- Permite consultar todos los clics registrados y filtrar por ID de prestador.

### Seguridad y profesionalismo

- `helmet`, `cors`, `compression` y `morgan` correctamente aplicados.
- Manejo de errores robusto:
  - 400 para validaciones fallidas.
  - 404 para rutas inválidas.
  - 500 para errores internos.
- Variables de entorno centralizadas en `.env` para separar configuración sensible.
- Código comentado línea por línea, pensado para trabajo en equipo y mantenimiento a largo plazo.

## Resultado

**Este backend está preparado para:**

- Soportar tráfico real de usuarios.
- Ser consumido por un frontend moderno.
- Ofrecer estadísticas reales sobre el contacto a prestadores.
- Escalar a mayores volúmenes de datos.

---

<div align="end">

Creado por [Juan Oliva](https://github.com/JuanOlivaDev) & [Joan Simonutti](https://www.linkedin.com/in/joansimonutti/) | 2025

</div>

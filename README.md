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
- **winston**: Librería de logging profesional para entornos de desarrollo y producción.
- **jsonwebtoken (JWT)**: Para autenticación segura.
- **express-rate-limit**: Para limitar requests y proteger rutas sensibles.
- **twilio**: Para envío de SMS.

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

- Registra cuándo un usuario contacta a un prestador.
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
- Uso de JWT para proteger rutas privadas.
- Rate limiting en las rutas `/auth` (máx. 4 requests/hora por IP).
- Logs profesionales con Winston para seguimiento de errores y procesos.

## Autenticación (`/auth`)

- Registro de usuarios mediante SMS.
- Envío de código de verificación al teléfono ingresado.
- Verificación del código y emisión de token JWT.
- Limpieza automática de códigos expirados.

### Endpoints Auth

#### POST `/auth/register`

Envía SMS al número ingresado.

**Body:**

```json
{
  "telefono": "+34624001234"
}
```

**Respuesta (modo desarrollo):**

```json
{
  "mensaje": "Código de verificación enviado (modo desarrollo, SMS simulado).",
  "codigo": "123456"
}
```

#### POST `/auth/verify`

Verifica el código y devuelve un token JWT.

**Body:**

```json
{
  "telefono": "+34624001234",
  "codigo": "123456"
}
```

**Respuesta:**

```json
{
  "mensaje": "Teléfono verificado correctamente.",
  "token": "<jwt-token>"
}
```

#### DELETE `/auth/cleanup`

Elimina códigos de verificación expirados.

**Respuesta:**

```json
{
  "success": true,
  "message": "Códigos expirados eliminados.",
  "usuariosLimpiados": 2
}
```

## Rutas privadas

Ejemplo de ruta privada que requiere token:

```
GET /privado
Authorization: Bearer <jwt-token>
```

**Respuesta:**

```json
{
  "mensaje": "Accediste a una ruta privada con éxito.",
  "usuario": {
    "userId": "...",
    "telefono": "+34624001234"
  }
}
```

## Ejemplo de flujo completo `/clic` vinculado a un servicio

### 1. Crear un servicio

```
POST /serv
```

**Body:**

```json
{
  "nombre": "Pedro López",
  "telefono": "+34624001234",
  "categoria": "Electricidad",
  "tipoServicio": "Instalaciones eléctricas en viviendas",
  "localidad": "Valencia",
  "horaDesde": 8,
  "horaHasta": 18,
  "urgencias24hs": true,
  "localidadesCercanas": false
}
```

### 2. Registrar un clic

```
POST /clic
```

**Body:**

```json
{
  "serviceId": "663c5c6e35f8adcb9ff5d92b",
  "tipo": "WhatsApp"
}
```

### 3. Consultar clics

```
GET /clic
```

**Respuesta:**

```json
[
  {
    "_id": "...",
    "serviceId": "663c5c6e35f8adcb9ff5d92b",
    "tipo": "WhatsApp",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

## Ejemplos de errores

**400 Bad Request**

```json
{
  "error": "El campo nombre es obligatorio."
}
```

**404 Not Found**

```json
{
  "error": "Servicio no encontrado"
}
```

**500 Internal Server Error**

```json
{
  "error": "Error interno del servidor"
}
```

## Variables de entorno

| Variable            | Descripción                            |
| ------------------- | -------------------------------------- |
| MONGO_URI           | URI de conexión a MongoDB Atlas        |
| JWT_SECRET          | Clave secreta para firmar tokens       |
| JWT_EXPIRES_IN      | Tiempo de expiración de los tokens JWT |
| TWILIO_ACCOUNT_SID  | SID de cuenta Twilio                   |
| TWILIO_AUTH_TOKEN   | Token de autenticación Twilio          |
| TWILIO_PHONE_NUMBER | Número verificado en Twilio            |
| PORT                | Puerto del servidor                    |

## Estructura de la base de datos

### User

```json
{
  "telefono": "+34624001234",
  "codigoVerificacion": "123456",
  "codigoExpira": "2025-07-14T10:55:00.000Z",
  "verificado": true,
  "createdAt": "2025-07-14T10:45:00.000Z",
  "updatedAt": "2025-07-14T10:50:00.000Z"
}
```

### Service

```json
{
  "nombre": "Pedro López",
  "telefono": "+34624001234",
  "categoria": "Electricidad",
  "tipoServicio": "Instalaciones eléctricas en viviendas",
  "localidad": "Valencia",
  "horaDesde": 8,
  "horaHasta": 18,
  "urgencias24hs": true,
  "localidadesCercanas": false,
  "createdAt": "2025-07-14T10:33:51.265Z",
  "updatedAt": "2025-07-14T10:33:51.265Z"
}
```

### Click

```json
{
  "serviceId": "663c5c6e35f8adcb9ff5d92b",
  "tipo": "WhatsApp",
  "createdAt": "2025-07-14T10:40:10.123Z",
  "updatedAt": "2025-07-14T10:40:10.123Z"
}
```

## Ejemplos de filtros avanzados

### Ordenar por nombre ascendente y horaDesde descendente

```
GET /serv?sort=nombre,-horaDesde
```

### Limitar resultados

```
GET /serv?limit=5
```

### Buscar coincidencia parcial en tipoServicio

```
GET /serv?tipoServicioLike=aire
```

Devuelve todos los servicios donde el tipo de servicio contiene la palabra `aire`.

## Resultado

**Este backend está preparado para:**

- Estar desplegado en Render.
- Ser ejecutado localmente para implementar cambios y pruebas sin afectar el entorno de producción.
- Soportar tráfico real de usuarios.
- Ser consumido por un frontend moderno.
- Ofrecer estadísticas reales sobre el contacto a prestadores.
- Escalar a mayores volúmenes de datos.

---

<div align="end">

Creado por [Joan Simonutti](https://www.linkedin.com/in/joansimonutti/) | 2025

</div>

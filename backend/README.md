# Backend de Sabores Urbanos

API REST de autenticación y clientes, construida con Express y MongoDB.

## Requisitos

- Node.js y npm.
- MongoDB disponible localmente o en un entorno de desarrollo.

## Instalación y configuración

Desde la carpeta `backend/`:

```powershell
npm install
Copy-Item .env.example .env
```

Edita `backend/.env` y configura `MONGO_URI`, `JWT_SECRET` y `JWT_EXPIRES_IN`. El archivo `.env.example` contiene valores de ejemplo para MongoDB local, no una URI productiva. Usa un secreto JWT aleatorio propio para cada entorno y no lo compartas ni lo subas al repositorio.

Para iniciar la API:

```powershell
npm run dev
```

El servidor usa el puerto `3001` por defecto. `FRONTEND_ORIGIN` configura el origen permitido por CORS; el valor de ejemplo es `http://localhost:5173`.

## Datos de desarrollo

Con MongoDB local en marcha y desde `backend/`, carga los datos de ejemplo:

```powershell
npm run seed
```

El seed **borra y vuelve a crear** los documentos de las colecciones Restaurantes, Clientes y Usuarios de la base configurada en `MONGO_URI`. Úsalo solo en una base desechable/de desarrollo; no lo ejecutes contra datos que deban conservarse.

Los siguientes perfiles y la contraseña compartida son exclusivamente para desarrollo local, después de ejecutar el seed. No reutilices esta contraseña en ningún otro entorno.

| Perfil | Correo | Restaurante |
| --- | --- | --- |
| Administrador General | `admin.general@saboresurbanos.dev` | Sin restaurante |
| Administrador de Local | `admin.local@saboresurbanos.dev` | Centro Demo |
| Garzón | `garzon@saboresurbanos.dev` | Centro Demo |
| Cocina | `cocina@saboresurbanos.dev` | Norte Demo |

**Contraseña de desarrollo para todos los perfiles:** `SaboresDev2026!`

## Endpoints

La URL base local es `http://localhost:3001/api`. Salvo el login, los endpoints de autenticación y clientes requieren `Authorization: Bearer <token>`.

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/auth/login` | Público |
| `POST` | `/auth/register` | Solo Administrador General |
| `GET` | `/auth/perfil` | Cualquier usuario autenticado |
| `GET` | `/clientes` | Administrador General, Administrador de Local o Garzón |
| `GET` | `/clientes/:id` | Administrador General, Administrador de Local o Garzón |
| `POST` | `/clientes` | Administrador General o Administrador de Local |
| `PUT` | `/clientes/:id` | Administrador General o Administrador de Local |
| `DELETE` | `/clientes/:id` | Administrador General o Administrador de Local; desactivación lógica |

Los usuarios locales solo pueden consultar y gestionar clientes de su restaurante. Cocina no tiene acceso a los endpoints de clientes. Las respuestas usan JSON con `success`, `data` y/o `message`; el password nunca se incluye en las respuestas. Los conflictos por email o RUT duplicados devuelven `409`.

## Postman

Importa `backend/postman/sabores-urbanos.postman_collection.json` en Postman. La colección usa `{{baseUrl}}` (por defecto `http://localhost:3001/api`) y `{{token}}`. También define credenciales demo de desarrollo. Ejecuta primero **Login Administrador General**: el test de esa solicitud valida la respuesta y guarda el JWT en `{{token}}`, que las demás solicitudes usan como Bearer token.

La colección incluye ejemplos de registro, perfil y operaciones CRUD de clientes, además de solicitudes para probar el correo duplicado (`409`), una consulta sin token (`401`) y el acceso denegado a Cocina (`403`). Para el último caso, ejecuta primero **Login Cocina (para probar rol sin permiso)**; esa solicitud reemplaza el token de colección con el token de ese perfil.

El ejemplo de registro de usuario local usa el ID de Restaurante Centro Demo creado por el seed (`672000000000000000000001`). Los IDs de clientes de ejemplo corresponden a los registros cargados por el seed. Para las solicitudes de escritura, ejecuta el seed antes de probarlas si necesitas restaurar esos registros.

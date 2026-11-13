# Backend Sabores Urbanos

API REST con Node.js, Express 5 y Mongoose 9.

## Reservas

Módulo de reservas de la vista de calendario (`frontend/src/pages/ReservasPage.jsx`).

### Instalación

Requisitos: Node.js 20 o superior y MongoDB (local o Atlas).

1. Crear `Backend/.env` con:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/sabores_urbanos
   PORT=5000
   ```

2. Instalar dependencias e iniciar el servidor:

   ```bash
   cd Backend
   npm install
   node server.js
   ```

   La API queda en `http://localhost:5000`.

### Datos de prueba (seeds)

Las reservas usan las mesas reales, así que primero se cargan las mesas:

```bash
node seeds/seedMesas.js     # 13 mesas (T-01 ... B-13)
npm run seed:reservas       # 18 reservas (borra solo la colección reservas)
```

Las reservas de prueba usan los 5 clientes de `frontend/src/data/clientesData.js`, las fechas 2026-10-16 y del 2026-11-12 al 2026-11-15, y los 4 estados. Incluyen la reserva de María González en la mesa M-09 el 2026-11-12 de 19:30 a 21:30, que se usa para probar el error 409.

### Pruebas con Postman

Archivos en `Backend/postman/`:

- `SaboresUrbanos-Reservas.postman_collection.json`: peticiones con tests.
- `SaboresUrbanos-Local.postman_environment.json`: `baseUrl = http://localhost:5000`.

**Desde Postman:** *Import* → seleccionar los dos archivos → elegir el entorno **SaboresUrbanos-Local** → ejecutar la colección con *Run collection*.

**Desde la terminal** (con el servidor corriendo y los seeds cargados):

```bash
npm run test:reservas
```

### Endpoints

Base: `/api/reservas`

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| GET | `/` | Lista reservas ordenadas por fecha e inicio. Filtros opcionales: `?fecha=AAAA-MM-DD`, `?estado`, `?mesa`, `?clienteRut` | 200 `{ total, reservas }`, 400 |
| GET | `/disponibilidad?fecha&inicio&duracion&mesa` | Comprueba si la mesa está libre (se puede enviar `fin` en vez de `duracion`, y opcionalmente `personas`) | 200 `{ disponible, mensaje, conflicto }`, 400, 404 |
| GET | `/:id` | Obtiene una reserva | 200, 400, 404 |
| POST | `/` | Crea una reserva. Acepta `fin` o `duracion` en minutos | 201, 400, 404, 409 |
| PUT | `/:id` | Edita una reserva (solo los campos enviados; también acepta `duracion`) | 200, 400, 404, 409 |
| PATCH | `/:id/estado` | Cambia el estado. Body: `{ "estado": "cancelada" }` | 200, 400, 404, 409 |
| DELETE | `/:id` | Elimina una reserva | 200, 400, 404 |

Ejemplo de body para `POST /api/reservas`:

```json
{
  "clienteRut": "12.345.678-9",
  "cliente": "Juan Pérez",
  "telefono": "+56 9 1234 5678",
  "personas": 4,
  "fecha": "2026-11-20",
  "inicio": "13:00",
  "duracion": 90,
  "mesa": "T-01",
  "observaciones": "Mesa junto a la ventana"
}
```

### Modelo `Reserva`

| Campo | Tipo | Reglas |
|---|---|---|
| `clienteRut` | String | Obligatorio, formato `12.345.678-9` (dígito K permitido, se guarda en mayúsculas) |
| `cliente` | String | Obligatorio, mínimo 2 caracteres |
| `telefono` | String | Obligatorio |
| `personas` | Number | Obligatorio, entero de 1 a 12 |
| `fecha` | String | Obligatorio, `AAAA-MM-DD` y fecha real (igual que el frontend) |
| `inicio` / `fin` | String | Obligatorios, `HH:mm`; `fin` posterior a `inicio` |
| `mesa` | String | Obligatorio, código de la mesa (`T-01`), se guarda en mayúsculas |
| `observaciones` | String | Opcional, máximo 300 caracteres |
| `estado` | String | `pendiente`, `confirmada` (por defecto), `en-espera` o `cancelada` |

### Reglas de negocio

Al crear, editar o reactivar una reserva (salvo que quede `cancelada`):

1. `inicio` debe estar en los horarios permitidos (12:00 a 15:00 y 19:00 a 22:00, cada 30 minutos) → 400.
2. La mesa debe existir en la colección `mesas` → 404; si está `fuera` de servicio → 400.
3. `personas` no puede superar la capacidad de la mesa → 400.
4. No puede cruzarse en horario con otra reserva no cancelada de la misma mesa y fecha → 409, indicando con qué reserva choca.

Errores de validación del modelo → 400 con un arreglo `errores`. Además, un índice único `{ mesa, fecha, inicio }` (solo para reservas no canceladas) protege ante peticiones simultáneas → 409.

Las reservas no modifican el `estado` de las mesas: ese estado lo maneja el módulo de mesas.

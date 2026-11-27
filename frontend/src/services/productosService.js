// Servicio de integración con el backend - Menú y Precios
import { API_BASE_URL, requestJson } from "./api";

// =========================================================
// Peticiones del menú con errores completos.
// requestJson solo conserva el mensaje; el menú necesita
// también errores[], status y sugerencia (ej. 409 al eliminar).
// =========================================================

function crearErrorProducto(datos, status, mensajePorDefecto) {
  const error = new Error(datos?.mensaje || datos?.message || mensajePorDefecto);

  error.status = status;
  error.errores = Array.isArray(datos?.errores) ? datos.errores : [];
  error.sugerencia = datos?.sugerencia ?? null;

  return error;
}

async function solicitarProducto(ruta, { method = "GET", body, token } = {}, mensajePorDefecto) {
  const headers = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;

  try {
    respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw crearErrorProducto(
      null,
      0,
      "No se pudo conectar con el servidor. Verifica que el backend esté disponible."
    );
  }

  let datos = null;

  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta sin cuerpo JSON
  }

  if (!respuesta.ok) {
    throw crearErrorProducto(datos, respuesta.status, mensajePorDefecto);
  }

  return datos;
}

// =========================================================
// Lectura (pública). Pedidos y Precios llaman sin argumentos.
// =========================================================

// filtros opcionales: { categoria, disponible, destacado, busqueda }
export function obtenerProductos(filtros = {}) {
  const parametros = new URLSearchParams();

  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      parametros.set(clave, String(valor));
    }
  }

  const consulta = parametros.toString();

  return requestJson(`/productos${consulta ? `?${consulta}` : ""}`);
}

export function obtenerCategorias() {
  return requestJson("/productos/categorias");
}

export function obtenerProducto(id) {
  return solicitarProducto(
    `/productos/${encodeURIComponent(id)}`,
    {},
    "No se pudo obtener el producto."
  );
}

// =========================================================
// Escritura. El token va al final (opcional) para no romper
// las llamadas existentes. Crear, editar, disponibilidad,
// destacado y eliminar requieren rol de administrador.
// =========================================================

export function crearProducto(producto, token) {
  return solicitarProducto(
    "/productos",
    { method: "POST", body: producto, token },
    "No se pudo crear el producto."
  );
}

// Si `cambios` trae precio (y motivo), el backend lo registra en el historial
export function actualizarProducto(id, cambios, token) {
  return solicitarProducto(
    `/productos/${encodeURIComponent(id)}`,
    { method: "PUT", body: cambios, token },
    "No se pudo actualizar el producto."
  );
}

export function cambiarDisponibilidad(id, disponible, token) {
  return solicitarProducto(
    `/productos/${encodeURIComponent(id)}/disponibilidad`,
    { method: "PATCH", body: { disponible }, token },
    "No se pudo cambiar la disponibilidad."
  );
}

export function cambiarDestacado(id, destacado, token) {
  return solicitarProducto(
    `/productos/${encodeURIComponent(id)}/destacado`,
    { method: "PATCH", body: { destacado }, token },
    "No se pudo cambiar el destacado."
  );
}

// Lo usa la página de Precios (sin token)
export function cambiarPrecioProducto(id, precio, motivo = "") {
  return requestJson(`/productos/${id}/precio`, {
    method: "PATCH",
    body: { precio, motivo },
  });
}

export function eliminarProducto(id, token) {
  return solicitarProducto(
    `/productos/${encodeURIComponent(id)}`,
    { method: "DELETE", token },
    "No se pudo eliminar el producto."
  );
}

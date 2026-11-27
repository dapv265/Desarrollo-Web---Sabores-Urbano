// Servicio de integración con el backend - Menú y Precios
import { requestJson } from "./api";

export function obtenerProductos() {
  return requestJson("/productos");
}

export function obtenerCategorias() {
  return requestJson("/productos/categorias");
}

export function crearProducto(producto) {
  return requestJson("/productos", { method: "POST", body: producto });
}

export function actualizarProducto(id, cambios) {
  return requestJson(`/productos/${id}`, { method: "PUT", body: cambios });
}

export function cambiarPrecioProducto(id, precio, motivo = "") {
  return requestJson(`/productos/${id}/precio`, {
    method: "PATCH",
    body: { precio, motivo },
  });
}

export function eliminarProducto(id) {
  return requestJson(`/productos/${id}`, { method: "DELETE" });
}

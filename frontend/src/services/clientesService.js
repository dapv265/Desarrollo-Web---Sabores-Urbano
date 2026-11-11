import { apiRequest } from "./api";

export function obtenerClientes(token) {
  return apiRequest("/clientes", { token });
}

export function crearCliente(token, cliente) {
  return apiRequest("/clientes", {
    method: "POST",
    token,
    body: cliente,
  });
}

export function actualizarCliente(token, id, cliente) {
  return apiRequest(`/clientes/${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: cliente,
  });
}

export function eliminarCliente(token, id) {
  return apiRequest(`/clientes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

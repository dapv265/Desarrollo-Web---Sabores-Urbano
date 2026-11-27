// Servicio de integración con el backend - RF9, RF10 y RF11 (Pedidos y Cocina)
// Todas las operaciones requieren sesión: el backend valida el rol de cada acción.
import { requestJson } from "./api";

export function obtenerPedidos(token, estados) {
  const filtro = estados?.length ? `?estado=${estados.join(",")}` : "";
  return requestJson(`/pedidos${filtro}`, { token });
}

// RF9: abrir pedido para una mesa (cliente opcional)
export function crearPedido(token, { mesaId, clienteId }) {
  return requestJson("/pedidos", {
    method: "POST",
    token,
    body: { mesaId, clienteId: clienteId || null },
  });
}

// RF10: el precio lo pone el servidor desde el menú vigente
export function agregarProductoPedido(token, pedidoId, { productoId, cantidad, observaciones }) {
  return requestJson(`/pedidos/${pedidoId}/items`, {
    method: "POST",
    token,
    body: { productoId, cantidad, observaciones },
  });
}

export function quitarProductoPedido(token, pedidoId, itemId) {
  return requestJson(`/pedidos/${pedidoId}/items/${itemId}`, {
    method: "DELETE",
    token,
  });
}

// Confirma la comanda: los productos sin enviar pasan a cocina de una vez
export function enviarComandaACocina(token, pedidoId) {
  return requestJson(`/pedidos/${pedidoId}/enviar`, {
    method: "POST",
    token,
  });
}

// Preparando / Listo (cocina), Pagado / Cancelado (salón)
export function cambiarEstadoPedido(token, pedidoId, estado) {
  return requestJson(`/pedidos/${pedidoId}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

export const ESTADOS_PEDIDO_ABIERTO = ["Pendiente", "Preparando", "Listo"];

export function obtenerIdPedido(pedido) {
  return pedido._id || pedido.id;
}

import { apiRequest } from "./api";

export function iniciarSesion(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function obtenerPerfil(token) {
  return apiRequest("/auth/perfil", { token });
}

export function listarUsuarios(token) {
  return apiRequest("/auth/usuarios", { token });
}

export function registrarUsuario(payload, token) {
  return apiRequest("/auth/register", {
    method: "POST",
    token,
    body: payload,
  });
}

export function cambiarEstadoUsuario(id, activo, token) {
  return apiRequest(`/auth/usuarios/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    token,
    body: { activo },
  });
}

export function eliminarUsuario(id, token) {
  return apiRequest(`/auth/usuarios/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

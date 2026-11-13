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

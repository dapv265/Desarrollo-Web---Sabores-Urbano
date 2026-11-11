const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, errors = [], options = {}) {
    super(message, options);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(
  path,
  { method = "GET", token, body } = {},
) {
  const headers = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica que el backend esté disponible.",
      0,
      [],
      { cause: error },
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ApiError(
      "El servidor devolvió una respuesta inválida.",
      response.status,
      [],
      { cause: error },
    );
  }

  if (!response.ok || payload?.success !== true || !("data" in payload)) {
    throw new ApiError(
      payload?.message || "La solicitud no pudo completarse.",
      response.status,
      payload?.errors || [],
    );
  }

  return payload.data;
}

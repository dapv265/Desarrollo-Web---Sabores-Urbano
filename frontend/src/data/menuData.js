import {
  Beef,
  CakeSlice,
  CupSoda,
  Salad,
  Soup,
  UtensilsCrossed,
} from "lucide-react";

// Los productos y categorías vienen del backend (/api/productos).
// Aquí solo queda lo que el menú necesita en la interfaz.

// Ícono por categoría (categoriaId del backend), para el placeholder sin foto
export const iconosCategoria = {
  1: Soup, // Entradas
  2: Beef, // Platos principales
  3: CupSoda, // Bebidas
  4: CakeSlice, // Postres
  5: Salad, // Ensaladas
};

export function obtenerIconoCategoria(categoriaId) {
  return iconosCategoria[categoriaId] ?? UtensilsCrossed;
}

// Mismos límites que valida el backend
export const LIMITES_PRODUCTO = {
  nombreMin: 2,
  nombreMax: 80,
  descripcionMax: 300,
  tiempoMin: 0,
  tiempoMax: 180,
  motivoMax: 200,
};

// Precio en pesos chilenos. Ej: 18000 -> "$18.000"
export function formatearPrecio(precio) {
  return `$${Number(precio || 0).toLocaleString("es-CL")}`;
}

// Fecha y hora en formato chileno. Ej: "27-11-2026, 13:45"
export function formatearFechaHora(fecha) {
  if (!fecha) return "";

  return new Date(fecha).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

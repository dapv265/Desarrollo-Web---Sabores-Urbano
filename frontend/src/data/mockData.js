export const mesasData = [
  { id: 1, numero: "Mesa 1", estado: "ocupado" },
  { id: 2, numero: "Mesa 2", estado: "disponible" },
  { id: 3, numero: "Mesa 3", estado: "disponible" },
];

export const clientesData = [
  { id: 1, nombre: "Juan Pérez" },
  { id: 2, nombre: "María Gómez" },
  { id: 3, nombre: "Cliente General" },
];

export const productosData = [
  { id: 1, nombre: "Lomo Saltado", precio: 12000, categoria: "Fondos", imagen: "/images/lomo_saltado.jpg" },
  { id: 2, nombre: "Ceviche Mixto", precio: 15000, categoria: "Entradas", imagen: "/images/ceviche_mixto.jpg" },
  { id: 3, nombre: "Pisco Sour", precio: 5000, categoria: "Bebidas", imagen: "/images/pisco_sour.jpg" },
  { id: 4, nombre: "Chupe de Camarones", precio: 14000, categoria: "Fondos", imagen: "/images/chupe_camarones.jpg" },
];

export const pedidosIniciales = [
  {
    id: 101,
    mesaId: 1,
    mesaNombre: "Mesa 1",
    cliente: "Juan Pérez",
    estado: "Preparando", // Preparando, Listo, Entregado
    hora: new Date().toLocaleTimeString(),
    items: [
      { id: 1, producto: "Lomo Saltado", cantidad: 2, precio: 12000, observaciones: "Sin cebolla", estado: 'Preparando' },
      { id: 3, producto: "Pisco Sour", cantidad: 2, precio: 5000, observaciones: "", estado: 'Preparando' }
    ]
  }
];

import { createElement, useState } from "react";

import { obtenerIconoCategoria } from "../../data/menuData";

// Imagen del producto. Si no hay imagen o falla al cargar,
// muestra un placeholder con el ícono de la categoría.
export default function ImagenProducto({
  imagen,
  nombre,
  categoriaId,
  categoria,
  className = "imagen-producto",
}) {
  // Imagen que falló (si cambia la ruta, se vuelve a intentar)
  const [imagenFallida, setImagenFallida] = useState(null);

  const mostrarImagen = imagen && imagen !== imagenFallida;

  return (
    <div className={className}>
      {mostrarImagen ? (
        <img
          src={imagen}
          alt={nombre}
          loading="lazy"
          onError={() => setImagenFallida(imagen)}
        />
      ) : (
        <div
          className="imagen-producto-placeholder"
          role="img"
          aria-label={`Sin foto de ${nombre}${categoria ? ` (${categoria})` : ""}`}
        >
          {/* Ícono de la categoría (mapa en data/menuData.js) */}
          {createElement(obtenerIconoCategoria(categoriaId), { "aria-hidden": "true" })}
          <span>Foto pendiente</span>
        </div>
      )}
    </div>
  );
}

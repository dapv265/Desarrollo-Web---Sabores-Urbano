import { useState } from "react";
import {
  Ban,
  Clock,
  Eye,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import ImagenProducto from "./ImagenProducto";
import { formatearPrecio } from "../../data/menuData";

// Tarjeta de un producto del menú.
// `puedeGestionar` muestra los controles de administrador.
// `accion` es la acción en curso de ESTE producto: "disponible", "destacado" o "eliminar".
// `conflicto` es el mensaje 409 al eliminar (producto en un pedido abierto).
export default function ProductoCard({
  producto,
  categoria,
  puedeGestionar,
  accion,
  bloqueado,
  conflicto,
  onVerDetalle,
  onEditar,
  onCambiarDisponibilidad,
  onCambiarDestacado,
  onEliminar,
  onMarcarNoDisponible,
  onCerrarConflicto,
}) {
  const [confirmandoEliminar, setConfirmandoEliminar] =
    useState(false);

  // Mientras se envía cualquier acción, los controles se deshabilitan
  const ocupado = bloqueado || Boolean(accion);

  function cerrarConflicto() {
    setConfirmandoEliminar(false);
    onCerrarConflicto();
  }

  return (
    <article
      className={
        producto.disponible
          ? "producto-card"
          : "producto-card producto-no-disponible"
      }
    >

      <ImagenProducto
        imagen={producto.imagen}
        nombre={producto.nombre}
        categoriaId={producto.categoriaId}
        categoria={categoria}
      />

      <div className="producto-card-superior">

        <div>
          <span className="categoria-producto">
            {categoria}
          </span>

          <h3>
            {producto.nombre}
          </h3>
        </div>

        <div className="etiquetas-producto">
          {producto.destacado && (
            <span className="etiqueta-destacado" title="Producto destacado">
              <Star aria-hidden="true" fill="currentColor" />
              Destacado
            </span>
          )}

          <span
            className={
              producto.disponible
                ? "estado-producto disponible"
                : "estado-producto no-disponible"
            }
          >
            {producto.disponible
              ? "Disponible"
              : "No disponible"}
          </span>
        </div>

      </div>

      {producto.descripcion && (
        <p className="descripcion-producto">
          {producto.descripcion}
        </p>
      )}

      <div className="datos-producto">

        <strong>
          {formatearPrecio(producto.precio)}
        </strong>

        <span>
          <Clock />
          {producto.tiempoPreparacion} min
        </span>

      </div>

      {/* Controles rápidos del administrador */}
      {puedeGestionar && (
        <div className="controles-producto">

          <label
            className={
              ocupado
                ? "interruptor-producto deshabilitado"
                : "interruptor-producto"
            }
          >
            <input
              type="checkbox"
              checked={producto.disponible}
              disabled={ocupado}
              onChange={() => onCambiarDisponibilidad(producto)}
            />
            <span />
            {accion === "disponible" ? "Guardando..." : "Disponible"}
          </label>

          <button
            type="button"
            className={
              producto.destacado
                ? "boton-destacado activo"
                : "boton-destacado"
            }
            aria-pressed={producto.destacado}
            disabled={ocupado}
            onClick={() => onCambiarDestacado(producto)}
            title={producto.destacado ? "Quitar de destacados" : "Marcar como destacado"}
          >
            <Star
              aria-hidden="true"
              fill={producto.destacado ? "currentColor" : "none"}
            />
            {accion === "destacado"
              ? "Guardando..."
              : producto.destacado ? "Destacado" : "Destacar"}
          </button>

        </div>
      )}

      {/* Eliminar: 409 por pedido abierto, confirmación o botones normales */}
      {puedeGestionar && conflicto ? (

        <div className="aviso-conflicto-producto" role="alert">
          <p>{conflicto}</p>

          <div className="botones-confirmacion-producto">
            <button
              type="button"
              className="boton-secundario-producto"
              onClick={cerrarConflicto}
              disabled={ocupado}
            >
              Cerrar
            </button>

            {producto.disponible && (
              <button
                type="button"
                className="boton-peligro-producto"
                onClick={() => onMarcarNoDisponible(producto)}
                disabled={ocupado}
              >
                <Ban />
                {accion === "disponible" ? "Guardando..." : "Marcar como no disponible"}
              </button>
            )}
          </div>
        </div>

      ) : puedeGestionar && confirmandoEliminar ? (

        <div className="confirmar-eliminar-producto" role="alertdialog" aria-label={`Eliminar ${producto.nombre}`}>
          <p>¿Eliminar "{producto.nombre}"?</p>

          <div className="botones-confirmacion-producto">
            <button
              type="button"
              className="boton-secundario-producto"
              onClick={() => setConfirmandoEliminar(false)}
              disabled={ocupado}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="boton-peligro-producto"
              onClick={() => onEliminar(producto)}
              disabled={ocupado}
            >
              <Trash2 />
              {accion === "eliminar" ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>

      ) : (

        <div className={puedeGestionar ? "botones-producto" : "botones-producto solo-lectura"}>

          <button
            type="button"
            className="boton-ver-producto"
            onClick={() => onVerDetalle(producto)}
          >
            <Eye />
            Ver detalle
          </button>

          {puedeGestionar && (
            <>
              <button
                type="button"
                className="boton-editar-producto"
                onClick={() => onEditar(producto)}
                disabled={ocupado}
              >
                <Pencil />
                Editar
              </button>

              <button
                type="button"
                className="boton-eliminar-producto"
                onClick={() => setConfirmandoEliminar(true)}
                disabled={ocupado}
                aria-label={`Eliminar ${producto.nombre}`}
              >
                <Trash2 />
                Eliminar
              </button>
            </>
          )}

        </div>

      )}

    </article>
  );
}

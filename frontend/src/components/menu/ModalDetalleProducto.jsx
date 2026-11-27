import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Clock,
  History,
  Star,
  Tag,
  X,
} from "lucide-react";

import ImagenProducto from "./ImagenProducto";
import { obtenerProducto } from "../../services/productosService";
import { formatearFechaHora, formatearPrecio } from "../../data/menuData";

// Detalle de un producto en solo lectura, con su historial de precios.
// Se monta al abrirse; pide el producto al backend para tener el historial al día.
export default function ModalDetalleProducto({
  producto: productoInicial,
  categoria,
  onCerrar,
}) {
  const [producto, setProducto] = useState(productoInicial);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerProducto(productoInicial.id)
      .then((actualizado) => {
        if (activo) setProducto(actualizado);
      })
      .catch((error) => {
        if (activo) setErrorCarga(error.message);
      });

    return () => {
      activo = false;
    };
  }, [productoInicial.id]);

  // Cerrar con Escape
  useEffect(() => {
    function manejarTecla(evento) {
      if (evento.key === "Escape") onCerrar();
    }

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [onCerrar]);

  // Más reciente primero
  const historial = [...(producto.historialPrecios ?? [])].reverse();

  return (
    <div
      className="fondo-modal-menu"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <section
        className="modal-editar-producto modal-detalle-producto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloDetalleProducto"
      >
        <div className="encabezado-modal-producto">
          <div>
            <span>DETALLE DEL PRODUCTO</span>
            <h2 id="tituloDetalleProducto">{producto.nombre}</h2>
          </div>

          <button
            type="button"
            className="boton-cerrar-modal"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
          >
            <X />
          </button>
        </div>

        <div className="cuerpo-detalle-producto">
          <ImagenProducto
            className="preview-producto-modal"
            imagen={producto.imagen}
            nombre={producto.nombre}
            categoriaId={producto.categoriaId}
            categoria={categoria}
          />

          <div className="datos-detalle-producto">
            <div className="etiquetas-producto">
              <span className={producto.disponible ? "estado-producto disponible" : "estado-producto no-disponible"}>
                {producto.disponible ? <BadgeCheck aria-hidden="true" /> : <Ban aria-hidden="true" />}
                {producto.disponible ? "Disponible" : "No disponible"}
              </span>

              {producto.destacado && (
                <span className="etiqueta-destacado">
                  <Star aria-hidden="true" fill="currentColor" />
                  Destacado
                </span>
              )}
            </div>

            <p className="descripcion-producto">
              {producto.descripcion || "Sin descripción."}
            </p>

            <dl className="lista-datos-producto">
              <div>
                <dt>Precio actual</dt>
                <dd className="precio-detalle-producto">{formatearPrecio(producto.precio)}</dd>
              </div>
              <div>
                <dt><Tag aria-hidden="true" /> Categoría</dt>
                <dd>{categoria}</dd>
              </div>
              <div>
                <dt><Clock aria-hidden="true" /> Preparación</dt>
                <dd>{producto.tiempoPreparacion} min</dd>
              </div>
              <div>
                <dt>Código</dt>
                <dd>#{producto.id}</dd>
              </div>
              {producto.createdAt && (
                <div>
                  <dt>Creado</dt>
                  <dd>{formatearFechaHora(producto.createdAt)}</dd>
                </div>
              )}
              {producto.updatedAt && (
                <div>
                  <dt>Actualizado</dt>
                  <dd>{formatearFechaHora(producto.updatedAt)}</dd>
                </div>
              )}
            </dl>

            <section className="historial-detalle-producto" aria-labelledby="tituloHistorialProducto">
              <h3 id="tituloHistorialProducto">
                <History aria-hidden="true" />
                Historial de precios
              </h3>

              {errorCarga && (
                <p className="aviso-detalle-producto" role="alert">{errorCarga}</p>
              )}

              {historial.length === 0 ? (
                <p className="aviso-detalle-producto">
                  Este producto todavía no tiene cambios de precio.
                </p>
              ) : (
                <ol>
                  {historial.map((cambio, indice) => (
                    <li key={`${cambio.fecha}-${indice}`}>
                      <span className="fecha-cambio-precio">{formatearFechaHora(cambio.fecha)}</span>
                      <span className="precios-cambio">
                        {formatearPrecio(cambio.precioAnterior)}
                        <ArrowRight aria-label="a" />
                        <strong>{formatearPrecio(cambio.precioNuevo)}</strong>
                      </span>
                      <span className="motivo-cambio-precio">
                        {cambio.motivo || "Sin motivo"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

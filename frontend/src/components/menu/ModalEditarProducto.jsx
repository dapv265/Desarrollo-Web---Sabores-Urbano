import { useEffect, useState } from "react";
import {
  CircleAlert,
  Clock,
  DollarSign,
  Image,
  MessageSquareText,
  Plus,
  Save,
  Sparkles,
  Tag,
  Type,
  X,
} from "lucide-react";

import ImagenProducto from "./ImagenProducto";
import { LIMITES_PRODUCTO, formatearPrecio } from "../../data/menuData";

// true si el texto es un número entero (ej. "18000")
const esEntero = (valor) =>
  String(valor).trim() !== "" && Number.isInteger(Number(valor));

// Mismas reglas que valida el backend
function validarFormulario(formulario, categorias) {
  const errores = [];
  const nombre = formulario.nombre.trim();
  const { nombreMin, nombreMax, descripcionMax, tiempoMin, tiempoMax } = LIMITES_PRODUCTO;

  if (nombre.length < nombreMin || nombre.length > nombreMax) {
    errores.push(`El nombre debe tener entre ${nombreMin} y ${nombreMax} caracteres.`);
  }

  if (formulario.descripcion.trim().length > descripcionMax) {
    errores.push(`La descripción no puede superar los ${descripcionMax} caracteres.`);
  }

  if (!esEntero(formulario.precio) || Number(formulario.precio) <= 0) {
    errores.push("El precio debe ser un número entero mayor a 0 (CLP).");
  }

  if (!categorias.some((categoria) => String(categoria.id) === String(formulario.categoriaId))) {
    errores.push("Seleccione una categoría de la lista.");
  }

  const tiempo = Number(formulario.tiempoPreparacion);

  if (!esEntero(formulario.tiempoPreparacion) || tiempo < tiempoMin || tiempo > tiempoMax) {
    errores.push(`El tiempo de preparación debe ser un entero entre ${tiempoMin} y ${tiempoMax} minutos.`);
  }

  return errores;
}

// Modal para crear (sin `producto`) o editar un producto.
// Se monta al abrirse: los valores iniciales se leen una sola vez.
// `onGuardar(datos)` debe lanzar el error del backend para mostrarlo aquí.
export default function ModalEditarProducto({
  producto,
  categorias,
  onCerrar,
  onGuardar,
}) {
  const esEdicion = Boolean(producto);

  const [formulario, setFormulario] = useState(() => ({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precio: producto ? String(producto.precio) : "",
    categoriaId: producto ? String(producto.categoriaId) : "",
    imagen: producto?.imagen ?? "",
    tiempoPreparacion: String(producto?.tiempoPreparacion ?? 10),
    disponible: producto?.disponible ?? true,
    destacado: Boolean(producto?.destacado),
    motivo: "",
  }));

  // { mensaje, errores[] } a mostrar dentro del modal
  const [problemas, setProblemas] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cerrar con Escape (salvo mientras se guarda)
  useEffect(() => {
    function manejarTecla(evento) {
      if (evento.key === "Escape" && !guardando) onCerrar();
    }

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [guardando, onCerrar]);

  const cambioPrecio =
    esEdicion && esEntero(formulario.precio) && Number(formulario.precio) !== producto.precio;

  function actualizarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    const errores = validarFormulario(formulario, categorias);

    if (errores.length > 0) {
      setProblemas({ mensaje: "Revisa los datos del producto:", errores });
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      precio: Number(formulario.precio),
      categoriaId: Number(formulario.categoriaId),
      imagen: formulario.imagen.trim(),
      tiempoPreparacion: Number(formulario.tiempoPreparacion),
      disponible: formulario.disponible,
      destacado: formulario.destacado,
    };

    // El PUT registra el cambio de precio en el historial con este motivo
    if (cambioPrecio) {
      datos.motivo = formulario.motivo.trim() || "Editado desde Menú";
    }

    setGuardando(true);
    setProblemas(null);

    try {
      // Si sale bien, el padre cierra (desmonta) el modal
      await onGuardar(datos);
    } catch (error) {
      setProblemas({
        mensaje: error.message,
        errores: error.errores ?? [],
      });
      setGuardando(false);
    }
  }

  return (
    <div
      className="fondo-modal-menu"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && !guardando) {
          onCerrar();
        }
      }}
    >
      <section
        className="modal-editar-producto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalProducto"
      >
        <div className="encabezado-modal-producto">
          <div>
            <span>{esEdicion ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}</span>
            <h2 id="tituloModalProducto">
              {esEdicion ? producto.nombre : "Agregar al menú"}
            </h2>
          </div>

          <button
            type="button"
            className="boton-cerrar-modal"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar modal"
          >
            <X />
          </button>
        </div>

        <form
          className="formulario-editar-producto"
          onSubmit={manejarSubmit}
          noValidate
        >
          <ImagenProducto
            className="preview-producto-modal"
            imagen={formulario.imagen.trim()}
            nombre={formulario.nombre || "Producto"}
            categoriaId={Number(formulario.categoriaId)}
          />

          <div className="campos-producto-modal">
            <div className="grupo-modal-producto campo-completo">
              <label htmlFor="productoNombre">
                <Type />
                Nombre
              </label>
              <input
                id="productoNombre"
                type="text"
                maxLength={LIMITES_PRODUCTO.nombreMax}
                value={formulario.nombre}
                onChange={(evento) => actualizarCampo("nombre", evento.target.value)}
                required
              />
            </div>

            <div className="grupo-modal-producto campo-completo">
              <label htmlFor="productoDescripcion">
                <Tag />
                Descripción (opcional)
              </label>
              <textarea
                id="productoDescripcion"
                rows="3"
                maxLength={LIMITES_PRODUCTO.descripcionMax}
                value={formulario.descripcion}
                onChange={(evento) => actualizarCampo("descripcion", evento.target.value)}
              />
              <small className="contador-modal-producto">
                {formulario.descripcion.length}/{LIMITES_PRODUCTO.descripcionMax}
              </small>
            </div>

            <div className="grupo-modal-producto">
              <label htmlFor="productoCategoria">
                <Tag />
                Categoría
              </label>
              <select
                id="productoCategoria"
                value={formulario.categoriaId}
                onChange={(evento) => actualizarCampo("categoriaId", evento.target.value)}
                required
              >
                <option value="">Seleccione categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grupo-modal-producto">
              <label htmlFor="productoPrecio">
                <DollarSign />
                Precio (CLP)
              </label>
              <input
                id="productoPrecio"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={formulario.precio}
                onChange={(evento) => actualizarCampo("precio", evento.target.value)}
                required
              />
            </div>

            {/* Si cambia el precio, se pide un motivo para el historial */}
            {cambioPrecio && (
              <div className="grupo-modal-producto campo-completo">
                <label htmlFor="productoMotivo">
                  <MessageSquareText />
                  Motivo del cambio de precio (opcional)
                </label>
                <input
                  id="productoMotivo"
                  type="text"
                  maxLength={LIMITES_PRODUCTO.motivoMax}
                  placeholder="Ej: alza de costos"
                  value={formulario.motivo}
                  onChange={(evento) => actualizarCampo("motivo", evento.target.value)}
                />
                <small className="contador-modal-producto">
                  {formatearPrecio(producto.precio)} → {formatearPrecio(formulario.precio)} quedará en el historial
                </small>
              </div>
            )}

            <div className="grupo-modal-producto">
              <label htmlFor="productoTiempo">
                <Clock />
                Tiempo (minutos)
              </label>
              <input
                id="productoTiempo"
                type="number"
                min={LIMITES_PRODUCTO.tiempoMin}
                max={LIMITES_PRODUCTO.tiempoMax}
                step="1"
                inputMode="numeric"
                value={formulario.tiempoPreparacion}
                onChange={(evento) => actualizarCampo("tiempoPreparacion", evento.target.value)}
                required
              />
            </div>

            <div className="grupo-modal-producto">
              <label htmlFor="productoImagen">
                <Image />
                Imagen (opcional)
              </label>
              <input
                id="productoImagen"
                type="text"
                value={formulario.imagen}
                onChange={(evento) => actualizarCampo("imagen", evento.target.value)}
                placeholder="/images/plato.jpg"
              />
            </div>

            <label className="interruptor-producto">
              <input
                type="checkbox"
                checked={formulario.disponible}
                onChange={(evento) => actualizarCampo("disponible", evento.target.checked)}
              />
              <span />
              Disponible
            </label>

            <label className="interruptor-producto">
              <input
                type="checkbox"
                checked={formulario.destacado}
                onChange={(evento) => actualizarCampo("destacado", evento.target.checked)}
              />
              <span />
              <Sparkles />
              Destacado
            </label>

            {/* Errores del frontend o del backend (400, 409 nombre repetido, 401...) */}
            {problemas && (
              <div className="errores-modal-producto campo-completo" role="alert">
                <CircleAlert aria-hidden="true" />
                <div>
                  <strong>{problemas.mensaje}</strong>
                  {problemas.errores.length > 0 && (
                    <ul>
                      {problemas.errores.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="acciones-modal-producto">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="boton-guardar-producto"
              disabled={guardando}
            >
              {esEdicion ? <Save /> : <Plus />}
              {guardando
                ? "Guardando..."
                : esEdicion ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

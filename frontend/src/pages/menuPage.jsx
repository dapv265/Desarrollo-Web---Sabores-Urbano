import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";

import ProductoCard from "../components/menu/ProductoCard";
import ModalEditarProducto from "../components/menu/ModalEditarProducto";
import ModalDetalleProducto from "../components/menu/ModalDetalleProducto";
import ImagenProducto from "../components/menu/ImagenProducto";
import { useAuth } from "../auth/useAuth";
import { ROLES } from "../auth/roles";
import { formatearPrecio } from "../data/menuData";
import {
  actualizarProducto,
  cambiarDestacado,
  cambiarDisponibilidad,
  crearProducto,
  eliminarProducto,
  obtenerCategorias,
  obtenerProductos,
} from "../services/productosService";

import "../styles/menu.css";

// Solo estos roles pueden modificar el menú (igual que el backend)
const ROLES_GESTION_MENU = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL];

// Tiempo que se muestra el aviso de éxito o error
const DURACION_AVISO = 4000;

// Texto del error según el código HTTP de una escritura
function mensajeDeError(error) {
  if (error.status === 401) return "Tu sesión expiró, vuelve a iniciar sesión.";
  if (error.status === 403) return "No tienes permisos para modificar el menú.";
  return error.message;
}

export default function MenuPage() {
  const { session } = useAuth();
  const token = session?.token;
  const puedeGestionar = ROLES_GESTION_MENU.includes(session?.usuario?.rol);

  // =========================================================
  // DATOS DEL BACKEND
  // =========================================================

  // Se incrementa para volver a cargar después de cada acción
  const [version, setVersion] = useState(0);

  // Datos cargados y la versión a la que corresponden
  const [datos, setDatos] = useState({
    version: null,
    productos: [],
    categorias: [],
    error: "",
  });

  const cargando = datos.version !== version;
  const { productos, categorias } = datos;

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerProductos(), obtenerCategorias()])
      .then(([productosApi, categoriasApi]) => {
        if (!activo) return;
        setDatos({ version, productos: productosApi, categorias: categoriasApi, error: "" });
      })
      .catch((error) => {
        if (!activo) return;
        // Se conservan los datos anteriores y se muestra el error con Reintentar
        setDatos((anteriores) => ({ ...anteriores, version, error: error.message }));
      });

    return () => {
      activo = false;
    };
  }, [version]);

  function recargar() {
    setVersion((actual) => actual + 1);
  }

  // =========================================================
  // AVISOS, FILTROS Y MODALES
  // =========================================================

  // { tipo: "exito" | "error", texto, id }
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!aviso) return undefined;

    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto, id: Date.now() });
  }

  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  // null = cerrado; { producto: null } = crear; { producto } = editar
  const [modalEditar, setModalEditar] = useState(null);
  const [productoDetalle, setProductoDetalle] = useState(null);

  // Acción en curso: { productoId, tipo: "disponible" | "destacado" | "eliminar" }
  const [accion, setAccion] = useState(null);

  // 409 al eliminar: { productoId, mensaje }
  const [conflicto, setConflicto] = useState(null);

  const cerrarModalEditar = useCallback(() => setModalEditar(null), []);
  const cerrarDetalle = useCallback(() => setProductoDetalle(null), []);

  function obtenerCategoria(categoriaId) {
    return (
      categorias.find((categoria) => categoria.id === categoriaId)?.nombre ||
      "Sin categoría"
    );
  }

  // =========================================================
  // ACCIONES (requieren rol de administrador)
  // =========================================================

  // Ejecuta una acción sobre un producto con su estado "en curso"
  async function ejecutarAccion(producto, tipo, peticion, textoExito) {
    setAccion({ productoId: producto.id, tipo });

    try {
      await peticion();
      mostrarAviso("exito", textoExito);
      return true;
    } catch (error) {
      mostrarAviso("error", mensajeDeError(error));
      return false;
    } finally {
      setAccion(null);
      recargar();
    }
  }

  function alternarDisponibilidad(producto) {
    const nuevo = !producto.disponible;

    return ejecutarAccion(
      producto,
      "disponible",
      () => cambiarDisponibilidad(producto.id, nuevo, token),
      nuevo
        ? `"${producto.nombre}" ahora está disponible`
        : `"${producto.nombre}" quedó como no disponible`
    );
  }

  function alternarDestacado(producto) {
    const nuevo = !producto.destacado;

    return ejecutarAccion(
      producto,
      "destacado",
      () => cambiarDestacado(producto.id, nuevo, token),
      nuevo
        ? `"${producto.nombre}" se agregó a destacados`
        : `"${producto.nombre}" se quitó de destacados`
    );
  }

  async function eliminar(producto) {
    setAccion({ productoId: producto.id, tipo: "eliminar" });

    try {
      await eliminarProducto(producto.id, token);
      setConflicto(null);
      mostrarAviso("exito", `"${producto.nombre}" se eliminó del menú`);
    } catch (error) {
      if (error.status === 409 && error.sugerencia === "marcar-no-disponible") {
        // Está en un pedido abierto: el mensaje y la opción se muestran en la tarjeta
        setConflicto({ productoId: producto.id, mensaje: error.message });
      } else {
        mostrarAviso("error", mensajeDeError(error));
      }
    } finally {
      setAccion(null);
      recargar();
    }
  }

  async function marcarNoDisponible(producto) {
    const ok = await ejecutarAccion(
      producto,
      "disponible",
      () => cambiarDisponibilidad(producto.id, false, token),
      `"${producto.nombre}" quedó como no disponible`
    );

    if (ok) setConflicto(null);
  }

  // Crear o editar. El error se lanza para que el modal lo muestre sin cerrarse
  async function guardarProducto(datosProducto) {
    const original = modalEditar?.producto;

    try {
      if (original) {
        await actualizarProducto(original.id, datosProducto, token);
        mostrarAviso("exito", `"${datosProducto.nombre}" se actualizó correctamente`);
      } else {
        await crearProducto(datosProducto, token);
        mostrarAviso("exito", `"${datosProducto.nombre}" se agregó al menú`);
      }
    } catch (error) {
      error.message = mensajeDeError(error);
      throw error;
    }

    setModalEditar(null);
    recargar();
  }

  // =========================================================
  // FILTROS Y RESÚMENES (sobre lo cargado)
  // =========================================================

  const textoBusqueda = busqueda.trim().toLowerCase();

  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaActiva === "todas" || producto.categoriaId === categoriaActiva;

    const coincideBusqueda =
      textoBusqueda === "" ||
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      (producto.descripcion || "").toLowerCase().includes(textoBusqueda);

    return coincideCategoria && coincideBusqueda;
  });

  const productosDestacados = productos.filter((producto) => producto.destacado);
  const totalDisponibles = productos.filter((producto) => producto.disponible).length;
  const sinDatos = cargando && datos.version === null;

  // =========================================================
  // INTERFAZ
  // =========================================================

  return (
    <section className="pagina-menu">
      <div className="contenedor-menu">

        <header className="cabecera-menu">
          <div>
            <span className="etiqueta-menu">MENÚ</span>
            <h1>Menú del restaurante</h1>
            <p>
              {puedeGestionar
                ? "Administra productos, categorías y disponibilidad."
                : "Carta del restaurante con precios y disponibilidad."}
            </p>
          </div>

          {puedeGestionar ? (
            <button
              type="button"
              className="boton-nuevo-producto"
              onClick={() => setModalEditar({ producto: null })}
              disabled={sinDatos}
            >
              <Plus />
              Nuevo producto
            </button>
          ) : (
            <UtensilsCrossed />
          )}
        </header>

        {/* Vista de solo lectura para visitantes y roles sin permiso */}
        {!puedeGestionar && (
          <p className="aviso-lectura-menu">
            <LockKeyhole aria-hidden="true" />
            <span>
              Inicia sesión como administrador para editar el menú.
            </span>
            {!session && <Link to="/login">Iniciar sesión</Link>}
          </p>
        )}

        {datos.error && (
          <div className="error-carga-menu" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{datos.error}</span>
            <button type="button" onClick={recargar} disabled={cargando}>
              <RotateCcw />
              {cargando ? "Reintentando..." : "Reintentar"}
            </button>
          </div>
        )}

        {sinDatos && (
          <p className="mensaje-menu-vacio cargando-menu" role="status">
            <LoaderCircle aria-hidden="true" />
            Cargando menú...
          </p>
        )}

        <section className="resumen-general-menu">
          <article>
            <UtensilsCrossed />
            <div>
              <span>Productos</span>
              <strong>{productos.length}</strong>
            </div>
          </article>

          <article>
            <BadgeCheck />
            <div>
              <span>Disponibles</span>
              <strong>{totalDisponibles}</strong>
            </div>
          </article>

          <article>
            <Sparkles />
            <div>
              <span>Destacados</span>
              <strong>{productosDestacados.length}</strong>
            </div>
          </article>
        </section>

        {productosDestacados.length > 0 && (
          <section className="destacados-menu">
            <div className="titulo-menu-seccion">
              <Sparkles />
              <div>
                <h2>Platos destacados</h2>
                <p>Los favoritos para mostrar primero en la carta.</p>
              </div>
            </div>

            <div className="grid-destacados-menu">
              {productosDestacados.map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  className="destacado-menu"
                  onClick={() => setProductoDetalle(producto)}
                  title={`Ver detalle de ${producto.nombre}`}
                >
                  <ImagenProducto
                    className="destacado-imagen"
                    imagen={producto.imagen}
                    nombre={producto.nombre}
                    categoriaId={producto.categoriaId}
                    categoria={obtenerCategoria(producto.categoriaId)}
                  />

                  <div>
                    <span>{obtenerCategoria(producto.categoriaId)}</span>
                    <h3>{producto.nombre}</h3>
                    <strong>{formatearPrecio(producto.precio)}</strong>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="panel-menu">
          <div className="barra-menu">
            <div className="buscador-menu">
              <Search />
              <input
                type="search"
                placeholder="Buscar producto"
                aria-label="Buscar producto"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
            </div>

            <div className="filtros-categorias-menu">
              <button
                type="button"
                className={categoriaActiva === "todas" ? "activo" : ""}
                aria-pressed={categoriaActiva === "todas"}
                onClick={() => setCategoriaActiva("todas")}
              >
                Todas
              </button>

              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  className={categoriaActiva === categoria.id ? "activo" : ""}
                  aria-pressed={categoriaActiva === categoria.id}
                  onClick={() => setCategoriaActiva(categoria.id)}
                >
                  {categoria.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="resumen-menu">
            <span>{productosFiltrados.length} productos</span>
            <span>
              {productosFiltrados.filter((producto) => producto.disponible).length}{" "}
              disponibles
            </span>
            {cargando && !sinDatos && (
              <span className="actualizando-menu" role="status">
                <LoaderCircle aria-hidden="true" />
                Actualizando...
              </span>
            )}
          </div>

          <div className="grid-productos-menu">
            {productosFiltrados.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                categoria={obtenerCategoria(producto.categoriaId)}
                puedeGestionar={puedeGestionar}
                accion={accion?.productoId === producto.id ? accion.tipo : null}
                bloqueado={Boolean(accion)}
                conflicto={conflicto?.productoId === producto.id ? conflicto.mensaje : null}
                onVerDetalle={setProductoDetalle}
                onEditar={(item) => setModalEditar({ producto: item })}
                onCambiarDisponibilidad={alternarDisponibilidad}
                onCambiarDestacado={alternarDestacado}
                onEliminar={eliminar}
                onMarcarNoDisponible={marcarNoDisponible}
                onCerrarConflicto={() => setConflicto(null)}
              />
            ))}
          </div>

          {!sinDatos && productosFiltrados.length === 0 && (
            <p className="mensaje-menu-vacio">
              No hay productos para mostrar.
            </p>
          )}
        </section>
      </div>

      {/* Aviso temporal de éxito o error */}
      {aviso && (
        <div
          key={aviso.id}
          className={`aviso-menu ${aviso.tipo}`}
          role={aviso.tipo === "error" ? "alert" : "status"}
        >
          {aviso.tipo === "exito" ? <CircleCheck /> : <CircleAlert />}
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <X />
          </button>
        </div>
      )}

      {/* Se montan al abrirse para partir con los datos correctos */}
      {modalEditar && (
        <ModalEditarProducto
          producto={modalEditar.producto}
          categorias={categorias}
          onCerrar={cerrarModalEditar}
          onGuardar={guardarProducto}
        />
      )}

      {productoDetalle && (
        <ModalDetalleProducto
          producto={productoDetalle}
          categoria={obtenerCategoria(productoDetalle.categoriaId)}
          onCerrar={cerrarDetalle}
        />
      )}
    </section>
  );
}

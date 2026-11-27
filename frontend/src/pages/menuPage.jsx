import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Search,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import ProductoCard from "../components/menu/ProductoCard";
import ModalEditarProducto from "../components/menu/ModalEditarProducto";
import {
  actualizarProducto,
  cambiarPrecioProducto,
  obtenerCategorias,
  obtenerProductos,
} from "../services/productosService";

import "../styles/menu.css";

export default function MenuPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState(null);
  const [modalEditarAbierto, setModalEditarAbierto] =
    useState(false);

  useEffect(() => {
    let activo = true;

    Promise.all([obtenerProductos(), obtenerCategorias()])
      .then(([productosApi, categoriasApi]) => {
        if (!activo) return;
        setProductos(productosApi);
        setCategorias(categoriasApi);
        setError("");
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  function reemplazarProducto(productoActualizado) {
    setProductos((productosActuales) =>
      productosActuales.map((item) =>
        item.id === productoActualizado.id ? productoActualizado : item
      )
    );
  }

  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria =
      categoriaActiva === "todas" ||
      producto.categoriaId === categoriaActiva;

    const textoBusqueda = busqueda.trim().toLowerCase();
    const coincideBusqueda =
      textoBusqueda === "" ||
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      producto.descripcion.toLowerCase().includes(textoBusqueda);

    return coincideCategoria && coincideBusqueda;
  });

  const productosDestacados = productos.filter(
    (producto) => producto.destacado
  );

  const productosDisponibles = productos.filter(
    (producto) => producto.disponible
  ).length;

  function obtenerCategoria(categoriaId) {
    return (
      categorias.find(
        (categoria) => categoria.id === categoriaId
      )?.nombre || "Sin categoria"
    );
  }

  async function cambiarDisponibilidad(productoId) {
    const producto = productos.find((item) => item.id === productoId);
    if (!producto) return;

    try {
      reemplazarProducto(
        await actualizarProducto(productoId, {
          disponible: !producto.disponible,
        })
      );
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function editarProducto(producto) {
    setProductoSeleccionado(producto);
    setModalEditarAbierto(true);
  }

  async function guardarProducto(productoEditado) {
    const original = productos.find((item) => item.id === productoEditado.id);

    try {
      let guardado = await actualizarProducto(productoEditado.id, productoEditado);

      // El precio se guarda aparte para que quede en el historial de Precios
      if (original && original.precio !== productoEditado.precio) {
        guardado = await cambiarPrecioProducto(
          productoEditado.id,
          productoEditado.precio,
          "Editado desde Menú"
        );
      }

      reemplazarProducto(guardado);
      setError("");
      setModalEditarAbierto(false);
      setProductoSeleccionado(null);
    } catch (err) {
      setError(err.message);
    }
  }

  function cerrarModalEditar() {
    setModalEditarAbierto(false);
    setProductoSeleccionado(null);
  }

  return (
    <section className="pagina-menu">
      <div className="contenedor-menu">
        <header className="cabecera-menu">
          <div>
            <span className="etiqueta-menu">MENU</span>
            <h1>Menu del restaurante</h1>
            <p>
              Administra productos, categorias y disponibilidad.
            </p>
          </div>

          <UtensilsCrossed />
        </header>

        {error && (
          <p className="mensaje-menu-vacio" role="alert">
            {error}
          </p>
        )}

        {cargando && (
          <p className="mensaje-menu-vacio" role="status">
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
              <strong>{productosDisponibles}</strong>
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

        <section className="destacados-menu">
          <div className="titulo-menu-seccion">
            <Sparkles />
            <div>
              <h2>Platos destacados</h2>
              <p>
                Los favoritos para mostrar primero en la carta.
              </p>
            </div>
          </div>

          <div className="grid-destacados-menu">
            {productosDestacados.map((producto) => (
              <article
                key={producto.id}
                className="destacado-menu"
              >
                <div className="destacado-imagen">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    onError={(evento) => {
                      evento.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div>
                  <span>
                    {obtenerCategoria(producto.categoriaId)}
                  </span>
                  <h3>{producto.nombre}</h3>
                  <strong>
                    ${producto.precio.toLocaleString("es-CO")}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel-menu">
          <div className="barra-menu">
            <div className="buscador-menu">
              <Search />
              <input
                type="search"
                placeholder="Buscar producto"
                value={busqueda}
                onChange={(evento) =>
                  setBusqueda(evento.target.value)
                }
              />
            </div>

            <div className="filtros-categorias-menu">
              <button
                type="button"
                className={
                  categoriaActiva === "todas" ? "activo" : ""
                }
                onClick={() => setCategoriaActiva("todas")}
              >
                Todas
              </button>

              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  type="button"
                  className={
                    categoriaActiva === categoria.id ? "activo" : ""
                  }
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
              {
                productosFiltrados.filter(
                  (producto) => producto.disponible
                ).length
              }{" "}
              disponibles
            </span>
          </div>

          <div className="grid-productos-menu">
            {productosFiltrados.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                categoria={obtenerCategoria(producto.categoriaId)}
                onEditar={editarProducto}
                onCambiarDisponibilidad={cambiarDisponibilidad}
              />
            ))}
          </div>

          {productosFiltrados.length === 0 && (
            <p className="mensaje-menu-vacio">
              No hay productos para mostrar.
            </p>
          )}
        </section>
      </div>

      <ModalEditarProducto
        abierto={modalEditarAbierto}
        producto={productoSeleccionado}
        categorias={categorias}
        onCerrar={cerrarModalEditar}
        onGuardar={guardarProducto}
      />
    </section>
  );
}

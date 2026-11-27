import { useEffect, useState } from "react";

import {
  ReceiptText,
  Tags,
} from "lucide-react";

import ProductoPrecioCard
  from "../components/menu/ProductoPrecioCard";

import ModalCambiarPrecio
  from "../components/menu/ModalCambiarPrecio";

import HistorialPrecios
  from "../components/menu/HistorialPrecios";

import {
  cambiarPrecioProducto,
  obtenerCategorias,
  obtenerProductos,
} from "../services/productosService";

import { obtenerPedidos } from "../services/pedidosService";

import { useAuth } from "../auth/useAuth";

import "../styles/precios.css";


// Convierte el historial guardado en cada producto al formato del modal
function construirHistorial(productos) {
  return productos.flatMap((producto) =>
    (producto.historialPrecios || []).map((cambio, indice) => ({
      id: `${producto.id}-${indice}`,
      productoId: producto.id,
      precioAnterior: cambio.precioAnterior,
      precioNuevo: cambio.precioNuevo,
      fecha: new Date(cambio.fecha).toLocaleDateString("es-CL"),
    }))
  );
}

// Los pedidos guardan el precio con el que se vendió cada producto
function construirPedidosHistoricos(pedidos) {
  return pedidos
    .filter((pedido) => pedido.items.length > 0)
    .map((pedido) => ({
      id: pedido._id,
      numero: `${pedido.mesaNombre} · ${pedido.estado}`,
      fecha: new Date(pedido.createdAt).toLocaleString("es-CL"),
      productos: pedido.items.map((item) => ({
        clave: item._id || item.id,
        productoId: item.productoId,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
      })),
    }));
}

export default function PreciosPage() {

  const { session } = useAuth();
  const token = session?.token;

  // =========================================================
  // PRODUCTOS
  // =========================================================

  const [
    productos,
    setProductos,
  ] = useState([]);

  const [
    pedidosHistoricos,
    setPedidosHistoricos,
  ] = useState([]);

  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    // El historial de pedidos requiere sesión; sin ella se muestran solo los productos
    const pedidosPromesa = token
      ? obtenerPedidos(token, ["Pagado", "Pendiente", "Preparando", "Listo"]).catch(() => [])
      : Promise.resolve([]);

    Promise.all([obtenerProductos(), obtenerCategorias(), pedidosPromesa])
      .then(([productosApi, categoriasApi, pedidosApi]) => {
        if (!activo) return;

        const nombres = new Map(categoriasApi.map((c) => [c.id, c.nombre]));
        setProductos(
          productosApi.map((producto) => ({
            ...producto,
            categoria: nombres.get(producto.categoriaId) || "Sin categoría",
          }))
        );
        setPedidosHistoricos(construirPedidosHistoricos(pedidosApi));
        setError("");
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });

    return () => {
      activo = false;
    };
  }, [token]);


  // =========================================================
  // HISTORIAL DE PRECIOS
  // =========================================================

  const historialPrecios = construirHistorial(productos);


  // =========================================================
  // PRODUCTO SELECCIONADO
  // =========================================================

  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState(null);


  // =========================================================
  // MODALES
  // =========================================================

  const [
    modalPrecioAbierto,
    setModalPrecioAbierto,
  ] = useState(false);


  const [
    historialAbierto,
    setHistorialAbierto,
  ] = useState(false);


  // =========================================================
  // ABRIR MODAL PARA CAMBIAR PRECIO
  // =========================================================

  function abrirCambioPrecio(producto) {

    setProductoSeleccionado(producto);

    setModalPrecioAbierto(true);

  }


  // =========================================================
  // ABRIR HISTORIAL
  // =========================================================

  function abrirHistorial(producto) {

    setProductoSeleccionado(producto);

    setHistorialAbierto(true);

  }


  // =========================================================
  // CAMBIAR PRECIO
  // =========================================================

  async function cambiarPrecio(
    producto,
    nuevoPrecio
  ) {

    try {
      const actualizado = await cambiarPrecioProducto(
        producto.id,
        nuevoPrecio,
        "Cambio desde Gestión de precios"
      );

      // Solo cambia el precio actual; los pedidos guardan su propio precio
      setProductos((productosActuales) =>
        productosActuales.map((item) =>
          item.id === actualizado.id
            ? { ...actualizado, categoria: item.categoria }
            : item
        )
      );
      setError("");
      setModalPrecioAbierto(false);
      setProductoSeleccionado(null);
    } catch (err) {
      setError(err.message);
    }

  }


  return (

    <main className="pagina-precios">

      <section className="contenedor-precios">


        {/* ===================================================
            CABECERA
        =================================================== */}

        <header className="cabecera-precios">

          <div>

            <span className="etiqueta-precios">
              RF8
            </span>

            <h1>
              Gestión de precios
            </h1>

            <p>
              Actualiza los precios de los productos
              conservando el valor histórico de
              los pedidos realizados.
            </p>

          </div>

          <Tags />

        </header>


        {error && (
          <p className="bg-red-50 text-red-700 border-l-4 border-red-500 p-3 rounded mb-4" role="alert">
            {error}
          </p>
        )}

        {/* ===================================================
            PRODUCTOS
        =================================================== */}

        <section className="seccion-precios">

          <h2>
            Productos
          </h2>


          <div className="grid-productos-precios">

            {productos.map(
              (producto) => (

                <ProductoPrecioCard
                  key={producto.id}
                  producto={producto}
                  onCambiarPrecio={
                    abrirCambioPrecio
                  }
                  onVerHistorial={
                    abrirHistorial
                  }
                />

              )
            )}

          </div>

        </section>


        {/* ===================================================
            PEDIDOS HISTÓRICOS
        =================================================== */}

        <section className="seccion-pedidos-historicos">

          <div className="titulo-seccion">

            <ReceiptText />

            <div>
              <h2>
                Pedidos realizados
              </h2>

              <p>
                Estos precios no cambian aunque
                se modifique el producto.
              </p>
            </div>

          </div>


          <div className="lista-pedidos-historicos">

            {pedidosHistoricos.map(
              (pedido) => (

                <article
                  key={pedido.id}
                  className="pedido-historico"
                >

                  <div className="pedido-historico-cabecera">

                    <strong>
                      Pedido {pedido.numero}
                    </strong>

                    <span>
                      {pedido.fecha}
                    </span>

                  </div>


                  {pedido.productos.map(
                    (producto) => (

                      <div
                        key={
                          producto.clave
                        }
                        className="producto-pedido-historico"
                      >

                        <div>

                          <strong>
                            {producto.nombre}
                          </strong>

                          <span>
                            Cantidad:
                            {" "}
                            {producto.cantidad}
                          </span>

                        </div>

                        <strong>
                          $
                          {producto.precioUnitario
                            .toLocaleString("es-CO")}
                        </strong>

                      </div>

                    )
                  )}

                </article>

              )
            )}

          </div>

        </section>


      </section>


      {/* =====================================================
          MODAL CAMBIAR PRECIO
      ===================================================== */}

      <ModalCambiarPrecio

        abierto={
          modalPrecioAbierto
        }

        producto={
          productoSeleccionado
        }

        onCerrar={() => {
          setModalPrecioAbierto(false);
          setProductoSeleccionado(null);
        }}

        onGuardar={
          cambiarPrecio
        }

      />


      {/* =====================================================
          HISTORIAL
      ===================================================== */}

      <HistorialPrecios

        abierto={
          historialAbierto
        }

        producto={
          productoSeleccionado
        }

        historial={
          historialPrecios
        }

        onCerrar={() => {
          setHistorialAbierto(false);
          setProductoSeleccionado(null);
        }}

      />


    </main>

  );

}
import { useEffect, useMemo, useState } from 'react';
import { Calculator, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../auth/roles';
import { obtenerRestaurantes } from '../services/restaurantesService';
import {
  crearReporte,
  eliminarReporte,
  generarReportesDesdePedidos,
  obtenerResumenReportes,
} from '../services/reportesService';

const PERIODOS_BASE = [
  { valor: 'Todos', etiqueta: 'Todos los períodos' },
  { valor: '2026-10', etiqueta: 'Octubre 2026 (2026-10)' },
  { valor: '2026-11', etiqueta: 'Noviembre 2026 (2026-11)' },
  { valor: '2026-12', etiqueta: 'Diciembre 2026 (2026-12)' },
];

const CATEGORIAS_PLATO = [
  'Entradas',
  'Fondos',
  'Postres',
  'Bebidas',
  'Promociones',
];

const PLATO_VACIO = {
  nombre: '',
  categoria: 'Fondos',
  cantidad: '',
  totalRecaudado: '',
};

function formatearMonedaCLP(monto) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(monto) || 0);
}

function formatearError(error) {
  const detalles = error?.errors
    ?.map((item) => item.message || item.msg)
    .filter(Boolean)
    .join(' ');

  return detalles
    ? `${error.message} ${detalles}`
    : error?.message || 'No se pudieron cargar los reportes.';
}

export default function ReportesPage() {
  const { session } = useAuth();
  const token = session?.token;
  const usuario = session?.usuario;
  const esAdminLocal =
    usuario?.rol === ROLES.ADMIN_LOCAL && Boolean(usuario?.restaurante);
  const restauranteAsignado = esAdminLocal ? String(usuario.restaurante) : '';

  const [periodo, setPeriodo] = useState('Todos');
  const [periodosExtra, setPeriodosExtra] = useState([]);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState('Todos');
  const [restaurantes, setRestaurantes] = useState([]);
  const [version, setVersion] = useState(0);

  const restauranteFiltro = esAdminLocal
    ? restauranteAsignado
    : restauranteSeleccionado;

  const [resumen, setResumen] = useState({
    periodo: '2026-10',
    kpis: {
      totalReportes: 0,
      ventasTotales: 0,
      pedidosTotales: 0,
      ocupacionPromedio: 0,
      platoEstrella: null,
    },
    ventasPorLocal: [],
    topPlatos: [],
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estado del formulario para subir un reporte
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState({
    periodo: '2026-11',
    restaurante: restauranteAsignado,
    pedidosTotales: '',
    ventasTotales: '',
    tasaOcupacion: '',
    observaciones: '',
    platosMasVendidos: [{ ...PLATO_VACIO }],
  });

  const periodosDisponibles = useMemo(() => {
    const existentes = new Set(PERIODOS_BASE.map((p) => p.valor));
    const extras = periodosExtra
      .filter((p) => !existentes.has(p))
      .map((p) => ({ valor: p, etiqueta: p }));
    return [...PERIODOS_BASE, ...extras];
  }, [periodosExtra]);

  useEffect(() => {
    let cancelado = false;

    obtenerRestaurantes({ token })
      .then((lista) => {
        if (!cancelado && Array.isArray(lista)) {
          setRestaurantes(lista);
        }
      })
      .catch(() => {
        // Si falla la carga auxiliar de restaurantes, el filtro queda con "Todos"
      });

    return () => {
      cancelado = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelado = false;

    obtenerResumenReportes({
      periodo,
      restaurante: restauranteFiltro,
      token,
    })
      .then((data) => {
        if (!cancelado && data) {
          setResumen(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setError(formatearError(err));
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [periodo, restauranteFiltro, token, version]);

  const abrirFormulario = () => {
    setError('');
    setMensaje('');
    setFormulario((prev) => ({
      ...prev,
      restaurante: esAdminLocal
        ? restauranteAsignado
        : prev.restaurante || restaurantes[0]?._id || '',
    }));
    setMostrarFormulario((abierto) => !abierto);
  };

  const cambiarCampoFormulario = (campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const cambiarPlato = (indice, campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      platosMasVendidos: prev.platosMasVendidos.map((plato, idx) =>
        idx === indice ? { ...plato, [campo]: valor } : plato,
      ),
    }));
  };

  const agregarFilaPlato = () => {
    setFormulario((prev) => ({
      ...prev,
      platosMasVendidos: [...prev.platosMasVendidos, { ...PLATO_VACIO }],
    }));
  };

  const quitarFilaPlato = (indice) => {
    setFormulario((prev) => ({
      ...prev,
      platosMasVendidos: prev.platosMasVendidos.filter((_, idx) => idx !== indice),
    }));
  };

  const handleSubirReporte = async (event) => {
    event.preventDefault();
    if (guardando) return;

    setError('');
    setMensaje('');

    const restauranteId = esAdminLocal
      ? restauranteAsignado
      : formulario.restaurante;

    if (!restauranteId) {
      setError('Selecciona un restaurante para subir el reporte.');
      return;
    }

    const platosValidos = formulario.platosMasVendidos
      .filter((p) => p.nombre.trim() !== '')
      .map((p) => ({
        nombre: p.nombre.trim(),
        categoria: p.categoria.trim() || 'Fondos',
        cantidad: Number(p.cantidad),
        totalRecaudado: Number(p.totalRecaudado),
      }));

    const payload = {
      periodo: formulario.periodo.trim(),
      restaurante: restauranteId,
      pedidosTotales: Number(formulario.pedidosTotales),
      ventasTotales: Number(formulario.ventasTotales),
      tasaOcupacion: Number(formulario.tasaOcupacion),
      platosMasVendidos: platosValidos,
      observaciones: formulario.observaciones.trim(),
    };

    try {
      setGuardando(true);
      await crearReporte(payload, token);

      const periodoCreado = payload.periodo;
      setPeriodosExtra((prev) =>
        prev.includes(periodoCreado) ? prev : [...prev, periodoCreado],
      );
      setPeriodo(periodoCreado);
      setCargando(true);
      setVersion((v) => v + 1);
      setMostrarFormulario(false);
      setFormulario({
        periodo: periodoCreado,
        restaurante: restauranteAsignado,
        pedidosTotales: '',
        ventasTotales: '',
        tasaOcupacion: '',
        observaciones: '',
        platosMasVendidos: [{ ...PLATO_VACIO }],
      });
      setMensaje(`Reporte del período ${periodoCreado} subido correctamente.`);
    } catch (err) {
      setError(formatearError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleGenerarDesdePedidos = async () => {
    if (guardando) return;
    setError('');
    setMensaje('');

    const ahora = new Date();
    const periodoObjetivo =
      periodo && periodo !== 'Todos'
        ? periodo
        : `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    try {
      setGuardando(true);
      const resultado = await generarReportesDesdePedidos({
        periodo: periodoObjetivo,
        restaurante: restauranteFiltro,
        token,
      });

      const periodoCalculado = resultado?.periodo || periodoObjetivo;
      setPeriodosExtra((prev) =>
        prev.includes(periodoCalculado) ? prev : [...prev, periodoCalculado],
      );
      setPeriodo(periodoCalculado);
      setCargando(true);
      setVersion((v) => v + 1);
      setMensaje(
        `Reporte(s) del período ${periodoCalculado} calculados automáticamente desde ${resultado?.totalPedidosAnalizados ?? 0} pedido(s) reales.`,
      );
    } catch (err) {
      setError(formatearError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarReporte = async (item) => {
    if (!item.reporteId || guardando) return;
    const nombreLocal = item.restaurante?.nombre || 'esta sucursal';
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar el reporte de ${nombreLocal} (${item.periodo})?`,
      )
    ) {
      return;
    }

    setError('');
    setMensaje('');

    try {
      setGuardando(true);
      await eliminarReporte(item.reporteId, token);
      setCargando(true);
      setVersion((v) => v + 1);
      setMensaje('Reporte eliminado correctamente.');
    } catch (err) {
      setError(formatearError(err));
    } finally {
      setGuardando(false);
    }
  };

  const { kpis, ventasPorLocal, topPlatos } = resumen;

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#123C39]">
            Reportes y Métricas Consolidadas
          </h1>
          <p className="text-gray-600 text-sm">
            Resumen de ventas, rendimiento y platos más solicitados por período y sucursal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <select
            aria-label="Filtrar por restaurante"
            value={restauranteFiltro}
            disabled={esAdminLocal}
            onChange={(e) => {
              setCargando(true);
              setRestauranteSeleccionado(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm bg-white font-semibold text-[#123C39] disabled:opacity-70"
          >
            {!esAdminLocal && (
              <option value="Todos">Todos los restaurantes</option>
            )}
            {restaurantes.map((local) => (
              <option key={local._id || local.id} value={local._id || local.id}>
                {local.codigo} - {local.nombre}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por período"
            value={periodo}
            onChange={(e) => {
              setCargando(true);
              setPeriodo(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm bg-white font-semibold text-[#123C39]"
          >
            {periodosDisponibles.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.etiqueta}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={guardando}
            onClick={handleGenerarDesdePedidos}
            className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" />
            {guardando ? 'Calculando...' : 'Generar desde pedidos'}
          </button>

          <button
            type="button"
            onClick={abrirFormulario}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            {mostrarFormulario ? 'Cerrar formulario' : 'Subir reporte'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {mensaje && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={handleSubirReporte} className="card space-y-5 bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#123C39]">
                Subir nuevo reporte mensual
              </h2>
              <p className="text-xs text-gray-500">
                Registra los indicadores de un período (AAAA-MM) para una sucursal. Solo puede existir un reporte por sucursal y período.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Restaurante / Sucursal
              <select
                value={esAdminLocal ? restauranteAsignado : formulario.restaurante}
                disabled={esAdminLocal}
                onChange={(e) => cambiarCampoFormulario('restaurante', e.target.value)}
                required
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-70"
              >
                <option value="">Selecciona una sucursal...</option>
                {restaurantes.map((local) => (
                  <option key={local._id} value={local._id}>
                    {local.codigo} - {local.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Período (AAAA-MM)
              <input
                type="month"
                value={formulario.periodo}
                onChange={(e) => cambiarCampoFormulario('periodo', e.target.value)}
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Pedidos totales
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="Ej: 450"
                value={formulario.pedidosTotales}
                onChange={(e) =>
                  cambiarCampoFormulario('pedidosTotales', e.target.value)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Ventas totales (CLP)
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="Ej: 6500000"
                value={formulario.ventasTotales}
                onChange={(e) =>
                  cambiarCampoFormulario('ventasTotales', e.target.value)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Tasa de ocupación (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                placeholder="Ej: 78"
                value={formulario.tasaOcupacion}
                onChange={(e) =>
                  cambiarCampoFormulario('tasaOcupacion', e.target.value)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 md:col-span-2 lg:col-span-1">
              Observaciones (opcional)
              <input
                type="text"
                maxLength={500}
                placeholder="Notas del cierre del período..."
                value={formulario.observaciones}
                onChange={(e) =>
                  cambiarCampoFormulario('observaciones', e.target.value)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#123C39]">
                Platos más vendidos (opcional)
              </h3>
              <button
                type="button"
                onClick={agregarFilaPlato}
                className="inline-flex items-center gap-1 rounded-md border border-[#123C39] px-3 py-1 text-xs font-semibold text-[#123C39] hover:bg-[#123C39]/5"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar plato
              </button>
            </div>

            {formulario.platosMasVendidos.map((plato, indice) => (
              <div
                key={indice}
                className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-12"
              >
                <input
                  type="text"
                  placeholder="Nombre del plato (ej: Lomo a lo Pobre)"
                  value={plato.nombre}
                  onChange={(e) => cambiarPlato(indice, 'nombre', e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-4"
                />

                <select
                  value={plato.categoria}
                  onChange={(e) =>
                    cambiarPlato(indice, 'categoria', e.target.value)
                  }
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-3"
                >
                  {CATEGORIAS_PLATO.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Cantidad"
                  required={plato.nombre.trim() !== ''}
                  value={plato.cantidad}
                  onChange={(e) =>
                    cambiarPlato(indice, 'cantidad', e.target.value)
                  }
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2"
                />

                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Recaudado CLP"
                  required={plato.nombre.trim() !== ''}
                  value={plato.totalRecaudado}
                  onChange={(e) =>
                    cambiarPlato(indice, 'totalRecaudado', e.target.value)
                  }
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2"
                />

                <div className="flex items-center justify-end md:col-span-1">
                  <button
                    type="button"
                    onClick={() => quitarFilaPlato(indice)}
                    aria-label="Quitar plato"
                    className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              disabled={guardando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar reporte'}
            </button>
          </div>
        </form>
      )}

      {/* Tarjetas KPI de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white border-l-4 border-l-[#123C39]">
          <p className="text-xs text-gray-500 font-bold uppercase">
            Ventas Totales
          </p>
          <p className="text-2xl font-bold text-[#123C39] mt-1">
            {formatearMonedaCLP(kpis?.ventasTotales)}
          </p>
          <p className="text-xs text-green-600 font-semibold mt-1">
            Período: {resumen.periodo || periodo}
          </p>
        </div>

        <div className="card bg-white border-l-4 border-l-[#B85C38]">
          <p className="text-xs text-gray-500 font-bold uppercase">
            Pedidos Procesados
          </p>
          <p className="text-2xl font-bold text-[#B85C38] mt-1">
            {kpis?.pedidosTotales ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {kpis?.totalReportes ?? 0} reporte(s) consolidados
          </p>
        </div>

        <div className="card bg-white border-l-4 border-l-[#C49A4A]">
          <p className="text-xs text-gray-500 font-bold uppercase">
            Ocupación Promedio
          </p>
          <p className="text-2xl font-bold text-[#C49A4A] mt-1">
            {kpis?.ocupacionPromedio ?? 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Sedes activas evaluadas</p>
        </div>

        <div className="card bg-white border-l-4 border-l-green-600">
          <p className="text-xs text-gray-500 font-bold uppercase">
            Plato Más Vendido
          </p>
          <p className="text-base font-bold text-gray-800 mt-1 truncate">
            {kpis?.platoEstrella?.nombre || 'Sin registros'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {kpis?.platoEstrella
              ? `${kpis.platoEstrella.cantidad} unidades (${formatearMonedaCLP(
                  kpis.platoEstrella.totalRecaudado,
                )})`
              : '0 unidades'}
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="card bg-white p-8 text-center text-gray-600" role="status">
          Cargando métricas y reportes desde el servidor...
        </div>
      ) : (
        <>
          {/* Tabla 1: Desglose por Restaurante */}
          <div className="card space-y-3">
            <h2 className="text-lg font-bold text-[#123C39]">
              Rendimiento por Restaurante
            </h2>
            <div className="table-responsive">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#123C39] text-white">
                  <tr>
                    <th className="p-3">Restaurante / Sucursal</th>
                    <th className="p-3">Período</th>
                    <th className="p-3">Pedidos</th>
                    <th className="p-3">Ventas Consolidadas</th>
                    <th className="p-3">Ocupación</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ventasPorLocal.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No hay reportes registrados para el período o sucursal seleccionada.
                      </td>
                    </tr>
                  ) : (
                    ventasPorLocal.map((item, index) => (
                      <tr
                        key={item.reporteId || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="p-3 font-semibold text-gray-800">
                          {item.restaurante?.nombre || item.local || 'Sucursal'}
                          {item.restaurante?.codigo && (
                            <span className="ml-2 text-xs font-mono text-gray-500">
                              ({item.restaurante.codigo})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-600">
                          {item.periodo || resumen.periodo}
                        </td>
                        <td className="p-3">{item.pedidosTotales ?? item.pedidos ?? 0}</td>
                        <td className="p-3 font-mono font-bold text-[#B85C38]">
                          {formatearMonedaCLP(item.ventasTotales)}
                        </td>
                        <td className="p-3">
                          <span className="badge badge-disponible">
                            {item.tasaOcupacion ?? 0}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() => handleEliminarReporte(item)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-45"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla 2: Platos más vendidos */}
          <div className="card space-y-3">
            <h2 className="text-lg font-bold text-[#123C39]">
              Top 5 Platos Más Solicitados
            </h2>
            <div className="table-responsive">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Plato / Producto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Unidades Vendidas</th>
                    <th className="p-3">Ingresos Generados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topPlatos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No hay platos registrados en este período.
                      </td>
                    </tr>
                  ) : (
                    topPlatos.map((plato, index) => (
                      <tr
                        key={`${plato.nombre}-${plato.categoria}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="p-3 font-bold text-[#123C39]">
                          {index + 1}
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {plato.nombre}
                        </td>
                        <td className="p-3">{plato.categoria}</td>
                        <td className="p-3 font-bold">{plato.cantidad}</td>
                        <td className="p-3 font-mono text-[#B85C38] font-bold">
                          {formatearMonedaCLP(plato.totalRecaudado)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

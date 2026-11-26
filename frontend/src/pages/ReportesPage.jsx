import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../auth/roles';
import { obtenerRestaurantes } from '../services/restaurantesService';
import { obtenerResumenReportes } from '../services/reportesService';

const PERIODOS_DISPONIBLES = [
  { valor: 'Todos', etiqueta: 'Todos los períodos' },
  { valor: '2026-10', etiqueta: 'Octubre 2026 (2026-10)' },
  { valor: '2026-11', etiqueta: 'Noviembre 2026 (2026-11)' },
  { valor: '2026-12', etiqueta: 'Diciembre 2026 (2026-12)' },
];

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

  const [periodo, setPeriodo] = useState('2026-10');
  const [restauranteFiltro, setRestauranteFiltro] = useState(
    esAdminLocal ? String(usuario.restaurante) : 'Todos',
  );
  const [restaurantes, setRestaurantes] = useState([]);

  useEffect(() => {
    if (esAdminLocal) {
      setRestauranteFiltro(String(usuario.restaurante));
    }
  }, [esAdminLocal, usuario?.restaurante]);
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

  const cargarResumen = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const data = await obtenerResumenReportes({
        periodo,
        restaurante: restauranteFiltro,
        token,
      });

      if (data) {
        setResumen(data);
      }
    } catch (err) {
      setError(formatearError(err));
    } finally {
      setCargando(false);
    }
  }, [periodo, restauranteFiltro, token]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

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
            onChange={(e) => setRestauranteFiltro(e.target.value)}
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
            onChange={(e) => setPeriodo(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm bg-white font-semibold text-[#123C39]"
          >
            {PERIODOS_DISPONIBLES.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.etiqueta}
              </option>
            ))}
          </select>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ventasPorLocal.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
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

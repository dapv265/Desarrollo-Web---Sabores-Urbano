import { useEffect, useState } from "react";
import { UserPlus, ShieldCheck, Power, Trash2 } from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { ROLES } from "../auth/roles";
import {
  cambiarEstadoUsuario,
  eliminarUsuario,
  listarUsuarios,
  registrarUsuario,
} from "../services/authService";
import { obtenerRestaurantes } from "../services/restaurantesService";

const FORMULARIO_INICIAL = {
  nombre: "",
  email: "",
  password: "",
  rol: ROLES.GARZON,
  restaurante: "",
};

const LISTA_ROLES = Object.values(ROLES);

export default function UsuariosPage() {
  const { session } = useAuth();
  const token = session?.token;
  const usuarioActualId = session?.usuario?.id;

  const [usuarios, setUsuarios] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) return;
    let activo = true;

    Promise.all([listarUsuarios(token), obtenerRestaurantes({ token })])
      .then(([resUsuarios, resRestaurantes]) => {
        if (!activo) return;
        setUsuarios(resUsuarios?.usuarios || []);
        setRestaurantes(Array.isArray(resRestaurantes) ? resRestaurantes : []);
        setError("");
      })
      .catch((err) => {
        if (activo) {
          setError(err.message || "No se pudieron cargar los usuarios.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const requiereRestaurante = formulario.rol !== ROLES.ADMIN_GENERAL;

  const handleCampo = (event) => {
    const { name, value } = event.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "rol" && value === ROLES.ADMIN_GENERAL
        ? { restaurante: "" }
        : {}),
    }));
  };

  const handleCrearUsuario = async (event) => {
    event.preventDefault();
    if (procesando) return;

    setError("");
    setMensaje("");

    if (requiereRestaurante && !formulario.restaurante) {
      setError("Selecciona una sucursal para este perfil.");
      return;
    }

    try {
      setProcesando(true);
      const payload = {
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        password: formulario.password,
        rol: formulario.rol,
        ...(requiereRestaurante ? { restaurante: formulario.restaurante } : {}),
      };

      await registrarUsuario(payload, token);
      const refrescado = await listarUsuarios(token);
      setUsuarios(refrescado?.usuarios || []);
      setFormulario(FORMULARIO_INICIAL);
      setMostrarFormulario(false);
      setMensaje("Usuario creado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo registrar el usuario.");
    } finally {
      setProcesando(false);
    }
  };

  const handleToggleEstado = async (usuario) => {
    if (procesando) return;
    setError("");
    setMensaje("");

    try {
      setProcesando(true);
      const nuevoEstado = !usuario.activo;
      const res = await cambiarEstadoUsuario(usuario.id, nuevoEstado, token);
      const actualizado = res?.usuario;

      if (actualizado) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
        );
      }

      setMensaje(
        nuevoEstado
          ? `Usuario ${usuario.nombre} reactivado.`
          : `Usuario ${usuario.nombre} desactivado.`,
      );
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado del usuario.");
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarUsuario = async (usuario) => {
    if (procesando) return;

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar permanentemente al usuario "${usuario.nombre}" (${usuario.email})? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    setError("");
    setMensaje("");

    try {
      setProcesando(true);
      await eliminarUsuario(usuario.id, token);
      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
      setMensaje(`Usuario ${usuario.nombre} eliminado correctamente.`);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="page-container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--color-brand-primary)]"
            style={{ fontFamily: "var(--font-headings)" }}
          >
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra cuentas del personal, perfiles de acceso y sucursales asignadas (RF1 / CU2).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMostrarFormulario((abierto) => !abierto);
            setError("");
            setMensaje("");
          }}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <UserPlus className="h-4 w-4" />
          {mostrarFormulario ? "Cerrar formulario" : "Nuevo usuario"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {mensaje && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700"
        >
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={handleCrearUsuario} className="card mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-brand-primary)]">
            Registrar nuevo usuario
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Nombre completo
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={handleCampo}
                required
                minLength={2}
                placeholder="Ej: Camila Rojas"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Correo electrónico
              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={handleCampo}
                required
                placeholder="usuario@saboresurbanos.dev"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Contraseña (mínimo 8 caracteres)
              <input
                type="password"
                name="password"
                value={formulario.password}
                onChange={handleCampo}
                required
                minLength={8}
                placeholder="••••••••"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Perfil / Rol
              <select
                name="rol"
                value={formulario.rol}
                onChange={handleCampo}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {LISTA_ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </label>

            {requiereRestaurante && (
              <label className="flex flex-col gap-1 text-sm font-medium md:col-span-2">
                Sucursal asignada
                <select
                  name="restaurante"
                  value={formulario.restaurante}
                  onChange={handleCampo}
                  required
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Selecciona una sucursal...</option>
                  {restaurantes
                    .filter((r) => r.estado !== "Cerrado")
                    .map((rest) => (
                      <option key={rest._id} value={rest._id}>
                        {rest.nombre} ({rest.codigo})
                      </option>
                    ))}
                </select>
              </label>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={procesando}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {procesando ? "Guardando..." : "Crear usuario"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              disabled={procesando}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="card">
        {cargando ? (
          <p className="text-sm text-gray-600">Cargando usuarios...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-gray-600">No hay usuarios registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-gray-500">
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Correo</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Sucursal</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const esMismoUsuario = String(u.id) === String(usuarioActualId);
                  const nombreSucursal =
                    u.restaurante && typeof u.restaurante === "object"
                      ? `${u.restaurante.nombre} (${u.restaurante.codigo})`
                      : u.rol === ROLES.ADMIN_GENERAL
                        ? "Todas las sucursales"
                        : "Sin asignar";

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="px-3 py-3 font-medium text-[var(--color-text-main)]">
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-[var(--color-brand-primary)]" />
                          {u.nombre}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{u.email}</td>
                      <td className="px-3 py-3">{u.rol}</td>
                      <td className="px-3 py-3 text-gray-600">{nombreSucursal}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`badge ${
                            u.activo ? "badge-disponible" : "badge-ocupado"
                          }`}
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={procesando || (esMismoUsuario && u.activo)}
                            onClick={() => handleToggleEstado(u)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                              u.activo
                                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                : "border-green-300 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            disabled={procesando || esMismoUsuario}
                            onClick={() => handleEliminarUsuario(u)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

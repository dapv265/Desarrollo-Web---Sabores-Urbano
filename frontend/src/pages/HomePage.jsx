import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Clock,
  DollarSign,
  LayoutGrid,
  Lock,
  ShieldCheck,
  UserCog,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { useAuth } from "../auth/useAuth";
import {
  MODULOS_SISTEMA,
  obtenerRutaInicial,
  puedeVisitarRuta,
} from "../auth/roles";

const ICONOS_MODULO = {
  "/mesas": LayoutGrid,
  "/disponibilidad": Clock,
  "/reservas": CalendarDays,
  "/menu": UtensilsCrossed,
  "/precios": DollarSign,
  "/pedidos": ClipboardList,
  "/cocina": ChefHat,
  "/restaurantes": Building2,
  "/usuarios": UserCog,
  "/clientes": Users,
  "/reportes": BarChart3,
};

const PILARES_PLATAFORMA = [
  {
    titulo: "Salón y Reservas",
    descripcion:
      "Control en tiempo real del mapa de mesas, disponibilidad por horario y reservas de clientes.",
    Icono: CalendarDays,
  },
  {
    titulo: "Pedidos y Cocina",
    descripcion:
      "Coordinación directa entre garzones y cocina para agilizar cada comanda sin errores.",
    Icono: ChefHat,
  },
  {
    titulo: "Gestión y Reportes",
    descripcion:
      "Administración centralizada de menú, precios, clientes, locales e indicadores operativos.",
    Icono: BarChart3,
  },
];

export default function HomePage() {
  const { session, loading } = useAuth();
  const usuario = session?.usuario || null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p role="status" className="text-sm text-gray-600">
          Verificando sesión...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <section className="page-container py-10 md:py-16">
        <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-primary)] px-6 py-12 text-white shadow-lg md:px-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-accent)]">
              <ShieldCheck className="h-4 w-4" />
              Plataforma interna de gestión gastronómica
            </span>

            <h1 className="mt-5 font-[var(--font-headings)] text-3xl font-bold leading-tight md:text-5xl">
              Bienvenido a Sabores Urbanos
            </h1>

            <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg">
              Centraliza la operación diaria de tus restaurantes: mesas,
              reservas, pedidos, cocina, menú y reportes en un solo lugar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-secondary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#96482a]"
              >
                Iniciar sesión
                <ArrowRight className="h-4 w-4" />
              </Link>

              <span className="inline-flex items-center gap-2 text-xs text-white/75">
                <Lock className="h-4 w-4 text-[var(--color-brand-accent)]" />
                Acceso restringido a personal autorizado
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILARES_PLATAFORMA.map(({ titulo, descripcion, Icono }) => (
            <div key={titulo} className="card flex flex-col gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-bg-main)] text-[var(--color-brand-primary)]">
                <Icono className="h-5 w-5" />
              </div>
              <h2 className="font-[var(--font-headings)] text-lg font-semibold text-[var(--color-brand-primary)]">
                {titulo}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {descripcion}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-white p-6">
          <h3 className="font-[var(--font-headings)] text-base font-semibold text-[var(--color-brand-primary)]">
            Acceso según tu perfil
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Al iniciar sesión con tu cuenta institucional, el sistema habilitará
            automáticamente los módulos correspondientes a tu rol:{" "}
            <strong className="text-[var(--color-text-main)]">
              Administrador General
            </strong>
            ,{" "}
            <strong className="text-[var(--color-text-main)]">
              Administrador de Local
            </strong>
            ,{" "}
            <strong className="text-[var(--color-text-main)]">Garzón</strong> o{" "}
            <strong className="text-[var(--color-text-main)]">Cocina</strong>.
          </p>
        </div>
      </section>
    );
  }

  const modulosPermitidos = MODULOS_SISTEMA.filter((modulo) =>
    puedeVisitarRuta(modulo.to, usuario.rol),
  );
  const rutaInicial = obtenerRutaInicial(usuario.rol);

  return (
    <section className="page-container py-8 md:py-12">
      <div className="rounded-2xl bg-[var(--color-brand-primary)] px-6 py-8 text-white shadow-md md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-[var(--color-brand-accent)]">
              {usuario.rol}
            </span>
            <h1 className="mt-3 font-[var(--font-headings)] text-2xl font-bold md:text-3xl">
              Hola, {usuario.nombre || usuario.email}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Selecciona uno de los módulos habilitados para tu perfil.
            </p>
          </div>

          {rutaInicial && (
            <Link
              to={rutaInicial}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--color-brand-secondary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#96482a]"
            >
              Ir a mi vista principal
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-[var(--font-headings)] text-lg font-semibold text-[var(--color-brand-primary)]">
          Tus módulos disponibles ({modulosPermitidos.length})
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulosPermitidos.map((modulo) => {
            const Icono = ICONOS_MODULO[modulo.to] || LayoutGrid;
            return (
              <Link
                key={modulo.to}
                to={modulo.to}
                className="card group flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-brand-secondary)] hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-main)] text-[var(--color-brand-primary)] transition-colors group-hover:bg-[var(--color-brand-primary)] group-hover:text-white">
                    <Icono className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-[var(--font-headings)] text-base font-semibold text-[var(--color-brand-primary)]">
                      {modulo.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {modulo.descripcion}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-secondary)]">
                  Abrir módulo
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

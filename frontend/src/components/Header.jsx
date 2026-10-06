import { useState } from "react";
import { NavLink } from "react-router-dom";

// Ajusta estas rutas a las que definan en App.jsx (deben coincidir con <Route path="...">)
const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/mesas", label: "Mesas" },
  { to: "/disponibilidad", label: "Disponibilidad" },
  { to: "/reservas", label: "Reservas" },
  { to: "/menu", label: "Menú" },
  { to: "/pedidos", label: "Pedidos" },
  { to: "/cocina", label: "Cocina" },
  { to: "/clientes", label: "Clientes" },
  { to: "/login", label: "Iniciar sesión" },
];

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const linkClase = ({ isActive }) =>
    [
      "text-sm font-medium transition-colors",
      isActive
        ? "text-[var(--color-brand-secondary)]"
        : "text-white/85 hover:text-white",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-brand-primary)] shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <NavLink
          to="/"
          className="font-[var(--font-headings)] text-lg font-semibold tracking-wide text-white"
          onClick={() => setMenuAbierto(false)}
        >
          SABORES URBANOS
        </NavLink>

        {/* navegación de escritorio */}
        <nav className="hidden md:flex md:items-center md:gap-7">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClase}>
              {link.label}
            </NavLink>
          ))}
        </nav>
                {/* chip de usuario — solo visual, sin lógica de login real */}
        <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90 md:flex">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-secondary)] text-[10px] font-bold text-white">
            A
          </span>
          Administrador de Local
        </span>
        

        {/* botón hamburguesa — solo en móvil */}
        <button
          type="button"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
        </button>
      </div>

      {/* menú móvil desplegable */}
      {menuAbierto && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-[var(--color-brand-primary)] px-5 pb-5 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-3 text-sm font-medium",
                  isActive
                    ? "bg-white/10 text-[var(--color-brand-secondary)]"
                    : "text-white/85",
                ].join(" ")
              }
              onClick={() => setMenuAbierto(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

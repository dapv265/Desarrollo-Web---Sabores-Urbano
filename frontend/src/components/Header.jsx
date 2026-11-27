import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { MODULOS_SISTEMA, puedeVisitarRuta } from "../auth/roles";

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const usuario = session?.usuario || null;

  const linksVisibles = usuario
    ? MODULOS_SISTEMA.filter((link) => puedeVisitarRuta(link.to, usuario.rol))
    : [];

  const handleCerrarSesion = () => {
    signOut();
    navigate("/", { replace: true });
  };

  const linkClase = ({ isActive }) =>
    [
      "whitespace-nowrap text-sm font-medium transition-colors",
      isActive
        ? "text-[var(--color-brand-secondary)]"
        : "text-white/85 hover:text-white",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-brand-primary)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <NavLink
          to="/"
          className="whitespace-nowrap font-[var(--font-headings)] text-lg font-semibold tracking-wide text-white"
          onClick={() => setMenuAbierto(false)}
        >
          SABORES URBANOS
        </NavLink>

        {/* navegación de escritorio — solo visible con sesión iniciada */}
        {usuario && (
          <nav className="hidden lg:flex lg:items-center lg:gap-5">
            {linksVisibles.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClase}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        {usuario ? (
          <div className="hidden items-center gap-3 text-xs text-white/90 lg:flex">
            <span className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5">
              {usuario.rol}
            </span>
            <button
              type="button"
              className="whitespace-nowrap rounded-md border border-white/30 px-3 py-1.5 transition-colors hover:bg-white/10"
              onClick={handleCerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-4 lg:flex">
            <NavLink to="/" end className={linkClase}>
              Inicio
            </NavLink>
            <NavLink
              to="/login"
              className="rounded-md bg-[var(--color-brand-secondary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#96482a]"
            >
              Iniciar sesión
            </NavLink>
          </div>
        )}

        {/* botón hamburguesa — móvil y tablet */}
        <button
          type="button"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
          <span className="h-0.5 w-6 bg-white" />
        </button>
      </div>

      {/* menú móvil/tablet desplegable */}
      {menuAbierto && (
        <nav className="flex flex-col gap-1 border-t border-white/10 bg-[var(--color-brand-primary)] px-5 pb-5 pt-2 lg:hidden">
          <NavLink
            to="/"
            end
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
            Inicio
          </NavLink>

          {usuario ? (
            <>
              {linksVisibles.map((link) => (
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
              <button
                type="button"
                className="mt-2 rounded-md border border-white/20 px-3 py-3 text-left text-sm font-medium text-white/90 hover:bg-white/10"
                onClick={() => {
                  setMenuAbierto(false);
                  handleCerrarSesion();
                }}
              >
                Cerrar sesión ({usuario.rol})
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="mt-2 rounded-md bg-[var(--color-brand-secondary)] px-3 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setMenuAbierto(false)}
            >
              Iniciar sesión
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}

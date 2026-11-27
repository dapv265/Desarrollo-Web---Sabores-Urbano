import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { puedeVisitarRuta } from "../auth/roles";

const FOOTER_LINKS = [
  { to: "/mesas", label: "Mesas" },
  { to: "/reservas", label: "Reservas" },
  { to: "/menu", label: "Menú" },
  { to: "/pedidos", label: "Pedidos" },
  { to: "/cocina", label: "Cocina" },
];

export default function Footer() {
  const { session } = useAuth();
  const usuario = session?.usuario || null;

  const linksVisibles = usuario
    ? FOOTER_LINKS.filter((link) => puedeVisitarRuta(link.to, usuario.rol))
    : [];

  return (
    <footer className="bg-[var(--color-brand-primary)] text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-[var(--font-headings)] text-base font-semibold text-white">
            SABORES URBANOS
          </p>
          <p className="mt-1 text-sm text-white/65">
            Tecnología para una operación gastronómica más simple.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/" className="hover:text-white">
            Inicio
          </Link>
          {usuario ? (
            linksVisibles.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-white">
                {link.label}
              </Link>
            ))
          ) : (
            <Link to="/login" className="hover:text-white">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/50">
        © 2026 Sabores Urbanos — Proyecto académico.
      </div>
    </footer>
  );
}

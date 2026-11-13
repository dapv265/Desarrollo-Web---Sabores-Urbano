import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { obtenerRutaInicial, ROLES_CLIENTES_LECTURA } from "../auth/roles";
import { iniciarSesion } from "../services/authService";

const LoginPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const { session, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      return;
    }

    const rol = session.usuario.rol;
    const requested = location.state?.from;
    const canVisitRequested =
      requested === "/clientes" && ROLES_CLIENTES_LECTURA.includes(rol);
    const destination = canVisitRequested ? requested : obtenerRutaInicial(rol);

    if (destination) {
      navigate(destination, { replace: true });
    } else {
      signOut();
    }
  }, [session, location.state, navigate, signOut]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await iniciarSesion({ email: email.trim(), password });
      const rol = result.usuario?.rol;
      const requested = location.state?.from;
      const canVisitRequested =
        requested === "/clientes" && ROLES_CLIENTES_LECTURA.includes(rol);
      const destination = canVisitRequested
        ? requested
        : obtenerRutaInicial(rol);

      if (!destination) {
        throw new Error(
          "El perfil de esta cuenta no tiene acceso a la aplicación.",
        );
      }

      signIn(result);
      setPassword("");
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-primary font-headings">
            Sabores Urbanos
          </h1>
          <p className="mt-2 text-gray-500">Ingresa a tu cuenta</p>
        </div>

        {error && (
          <p
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <p className="mb-5 text-sm text-gray-600">
          El perfil y los permisos se asignan a tu cuenta.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="login-email" className="text-sm font-semibold">
              Correo Electrónico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className="rounded-md border p-2"
              placeholder="correo@saboresurbanos.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="login-password" className="text-sm font-semibold">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="rounded-md border p-2"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

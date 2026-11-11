import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthContext } from "./sessionContext";
import { obtenerPerfil } from "../services/authService";

const TOKEN_KEY = "sabores-urbanos.token";
const USER_KEY = "sabores-urbanos.usuario";

function usuarioSeguro(usuario) {
  if (!usuario || typeof usuario.rol !== "string") {
    throw new Error("La respuesta de autenticación no contiene un perfil válido.");
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre || "",
    email: usuario.email || "",
    rol: usuario.rol,
    restaurante: usuario.restaurante || null,
    activo: usuario.activo !== false,
  };
}

function limpiarAlmacenamiento() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("No se pudo limpiar la sesión almacenada.", error);
  }
}

function leerSesionAlmacenada() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const usuarioGuardado = localStorage.getItem(USER_KEY);

    if (!token || !usuarioGuardado) {
      return null;
    }

    return {
      token,
      usuario: usuarioSeguro(JSON.parse(usuarioGuardado)),
    };
  } catch (error) {
    console.error("La sesión almacenada no se pudo recuperar.", error);
    limpiarAlmacenamiento();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sesionRestaurada] = useState(leerSesionAlmacenada);
  const [session, setSession] = useState(sesionRestaurada);
  const [loading, setLoading] = useState(Boolean(sesionRestaurada));

  const signIn = useCallback(({ token, usuario }) => {
    if (!token) {
      throw new Error("El servidor no devolvió un token de acceso.");
    }

    const user = usuarioSeguro(usuario);

    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      limpiarAlmacenamiento();
      throw new Error("No se pudo guardar la sesión en este navegador.", {
        cause: error,
      });
    }

    setSession({ token, usuario: user });
  }, []);

  const signOut = useCallback(() => {
    limpiarAlmacenamiento();
    setSession(null);
  }, []);

  useEffect(() => {
    if (!sesionRestaurada?.token) {
      return undefined;
    }

    let cancelled = false;

    obtenerPerfil(sesionRestaurada.token)
      .then(({ usuario }) => {
        if (cancelled) {
          return;
        }

        const user = usuarioSeguro(usuario);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setSession({ token: sesionRestaurada.token, usuario: user });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error.status === 401) {
          signOut();
          return;
        }

        console.error("No se pudo verificar la sesión guardada.", error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sesionRestaurada, signOut]);

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

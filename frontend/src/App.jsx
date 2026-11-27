import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/useAuth";
import {
  obtenerRutaInicial,
  ROLES_CLIENTES_LECTURA,
  ROLES_COCINA,
  ROLES_DISPONIBILIDAD,
  ROLES_MENU,
  ROLES_MESAS,
  ROLES_PEDIDOS,
  ROLES_PRECIOS,
  ROLES_REPORTES,
  ROLES_RESERVAS,
  ROLES_RESTAURANTES,
  ROLES_USUARIOS,
} from "./auth/roles";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import MesasPage from "./pages/MesasPage";
import ReservasPage from "./pages/ReservasPage";
import PedidosPage from "./pages/pedidos/PedidosPage";
import CocinaPage from "./pages/cocina/CocinaPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import UsuariosPage from "./pages/UsuariosPage";
import ReportesPage from "./pages/ReportesPage";
import LoginPage from "./pages/LoginPage";
import ClientesPage from "./pages/ClientesPage";
import PreciosPage from "./pages/PreciosPage";
import MenuPage from "./pages/menuPage";
import DisponibilidadPage from "./pages/DisponibilidadPage";

// Exige sesión iniciada y uno de los roles indicados para entrar a la ruta
function RutaPorRol({ roles, ruta, nombre }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p role="status">Verificando sesión...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: ruta,
          message: `Inicia sesión para acceder a ${nombre}.`,
        }}
      />
    );
  }

  if (!roles.includes(session.usuario.rol)) {
    return (
      <Navigate
        to={obtenerRutaInicial(session.usuario.rol) || "/"}
        replace
      />
    );
  }

  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />

        <main className="min-h-screen bg-[var(--color-bg-main)]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RutaPorRol roles={ROLES_MESAS} ruta="/mesas" nombre="Mesas" />}>
              <Route path="/mesas" element={<MesasPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_DISPONIBILIDAD} ruta="/disponibilidad" nombre="Disponibilidad" />}>
              <Route path="/disponibilidad" element={<DisponibilidadPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_RESERVAS} ruta="/reservas" nombre="Reservas" />}>
              <Route path="/reservas" element={<ReservasPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_MENU} ruta="/menu" nombre="Menú" />}>
              <Route path="/menu" element={<MenuPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_PRECIOS} ruta="/precios" nombre="Precios" />}>
              <Route path="/precios" element={<PreciosPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_PEDIDOS} ruta="/pedidos" nombre="Pedidos" />}>
              <Route path="/pedidos" element={<PedidosPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_COCINA} ruta="/cocina" nombre="Cocina" />}>
              <Route path="/cocina" element={<CocinaPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_RESTAURANTES} ruta="/restaurantes" nombre="Restaurantes" />}>
              <Route path="/restaurantes" element={<RestaurantsPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_USUARIOS} ruta="/usuarios" nombre="Usuarios" />}>
              <Route path="/usuarios" element={<UsuariosPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_CLIENTES_LECTURA} ruta="/clientes" nombre="Clientes" />}>
              <Route path="/clientes" element={<ClientesPage />} />
            </Route>
            <Route element={<RutaPorRol roles={ROLES_REPORTES} ruta="/reportes" nombre="Reportes" />}>
              <Route path="/reportes" element={<ReportesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

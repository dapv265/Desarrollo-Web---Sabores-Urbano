import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/useAuth";
import {
  obtenerRutaInicial,
  ROLES_CLIENTES_LECTURA,
} from "./auth/roles";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CocinaPage from "./pages/cocina/CocinaPage";
import ClientesPage from "./pages/ClientesPage";
import DisponibilidadPage from "./pages/DisponibilidadPage";
import LoginPage from "./pages/LoginPage";
import MesasPage from "./pages/MesasPage";
import MenuPage from "./pages/menuPage";
import PedidosPage from "./pages/pedidos/PedidosPage";
import PreciosPage from "./pages/PreciosPage";
import ReportesPage from "./pages/ReportesPage";
import ReservasPage from "./pages/ReservasPage";
import RestaurantsPage from "./pages/RestaurantsPage";

function PrivateLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p role="status">Verificando sesión...</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-100">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function ClientesRoleLayout() {
  const { session } = useAuth();
  if (!ROLES_CLIENTES_LECTURA.includes(session.usuario.rol)) {
    return (
      <Navigate
        to={obtenerRutaInicial(session.usuario.rol) || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateLayout />}>
        <Route path="/" element={<MesasPage />} />
        <Route path="/mesas" element={<MesasPage />} />
        <Route path="/reservas" element={<ReservasPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/cocina" element={<CocinaPage />} />
        <Route path="/restaurantes" element={<RestaurantsPage />} />
        <Route element={<ClientesRoleLayout />}>
          <Route path="/clientes" element={<ClientesPage />} />
        </Route>
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/disponibilidad" element={<DisponibilidadPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/precios" element={<PreciosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

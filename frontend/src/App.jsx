import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos Componentes Globales (Header y Footer de Alonso)
import Header from './components/Header';
import Footer from './components/Footer';

// Importamos las páginas que ya tenías
import MesasPage from './pages/MesasPage';
import ReservasPage from './pages/ReservasPage';
import PedidosPage from './pages/pedidos/PedidosPage';
import CocinaPage from './pages/cocina/CocinaPage';
import RestaurantsPage from './pages/RestaurantsPage';
import ReportesPage from './pages/ReportesPage';
import LoginPage from './pages/LoginPage';
import ClientesPage from './pages/ClientesPage';

// 1. AQUÍ ESTÁ IMPORTADA TU NUEVA PÁGINA
import DisponibilidadPage from './pages/DisponibilidadPage';

export default function App() {
  return (
    <BrowserRouter>
      {/* El Header que hizo Alonso en la rama main */}
      <Header />

      <main className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<MesasPage />} />
          <Route path="/mesas" element={<MesasPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/reservas" element={<ReservasPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/cocina" element={<CocinaPage />} />
          <Route path="/restaurantes" element={<RestaurantsPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/disponibilidad" element={<DisponibilidadPage />} />
        </Routes>
      </main>

      {/* El Footer que hizo Alonso en la rama main */}
      <Footer />
    </BrowserRouter>
  );
}

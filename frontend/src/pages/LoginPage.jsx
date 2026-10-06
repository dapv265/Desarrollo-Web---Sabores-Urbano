import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfil, setPerfil] = useState('Administrador');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulacin de login
    console.log("Iniciando sesin con:", { email, password, perfil });
    // Navegar a la pgina principal despus del login
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold" className="text-brand-primary font-headings">
            Sabores Urbanos
          </h2>
          <p className="text-gray-500 mt-2">Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Perfil de Usuario</label>
            <select 
              className="border p-2 rounded-md"
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
            >
              <option value="Administrador General">Administrador General</option>
              <option value="Administrador de Local">Administrador de Local</option>
              <option value="Garzón">Garzón</option>
              <option value="Cocina">Cocina</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Correo Electrónico</label>
            <input 
              type="email" 
              className="border p-2 rounded-md"
              placeholder="correo@saboresurbanos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm">Contraseña</label>
            <input 
              type="password" 
              className="border p-2 rounded-md"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary mt-4 w-full">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import DashboardProfesionalDetalle from './components/DashboardProfesionalDetalle';
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import Profesionales from "./components/Profesionales";
import Fichas from "./components/Fichas";
import DashboardProyectos from "./components/DashboardProyectos";
import Perfil from "./components/Perfil";
import SolicitudProyecto from "./components/SolicitudProyecto";
import PublicSolicitudForm from "./components/PublicSolicitudForm";
import Admin from "./components/Admin";

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Componente wrapper para manejar la navegación con autenticación
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  // Redirigir automáticamente si ya está autenticado
  useEffect(() => {
    if (!isLoading && isAuthenticated && !redirecting) {
      const currentPath = location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password' || currentPath === '/reset-password') {
        setRedirecting(true);
        console.log('🔄 Usuario autenticado, redirigiendo a dashboard...');
        window.location.href = '/dashboard';
        setTimeout(() => setRedirecting(false), 500);
      }
    }
  }, [isAuthenticated, isLoading, redirecting, location]);

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('current_user');
    if (token && userData && !isAuthenticated && !isLoading) {
      console.log('🔑 Token encontrado en localStorage');
    }
  }, [isAuthenticated, isLoading]);

  const handleLoginSuccess = () => {
    console.log("✅ Login exitoso, redirigiendo a dashboard...");
    // 🔥 REDIRECCIÓN FORZADA CON WINDOW.LOCATION
    window.location.href = '/dashboard';
  };

  const handleSwitchToRegister = () => {
    navigate("/register");
  };

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  const handleSwitchToForgotPassword = () => {
    navigate("/forgot-password");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <Login
              onSwitchToRegister={handleSwitchToRegister}
              onSwitchToForgotPassword={handleSwitchToForgotPassword}
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/register"
        element={
          !isAuthenticated ? (
            <Register onSwitchToLogin={handleSwitchToLogin} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={
          !isAuthenticated ? (
            <ForgotPassword onSwitchToLogin={handleSwitchToLogin} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/reset-password"
        element={
          !isAuthenticated ? (
            <ResetPassword onSwitchToLogin={handleSwitchToLogin} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      {/* Ruta pública para formulario externo - SIN AUTENTICACIÓN */}
      <Route
        path="/formulario-solicitud/:token"
        element={<PublicSolicitudForm />}
      />

      {/* Rutas protegidas (requieren autenticación) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesionales"
        element={
          <ProtectedRoute>
            <Profesionales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fichas"
        element={
          <ProtectedRoute>
            <Fichas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-proyectos"
        element={
          <ProtectedRoute>
            <DashboardProyectos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-profesional"
        element={
          <ProtectedRoute>
            <DashboardProfesionalDetalle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/solicitud-proyecto"
        element={
          <ProtectedRoute>
            <SolicitudProyecto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
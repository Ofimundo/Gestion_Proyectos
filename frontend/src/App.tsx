import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import Profesionales from "./components/Profesionales";
import Fichas from "./components/Fichas";
import DashboardProyectos from "./components/DashboardProyectos";
import Perfil from "./components/Perfil";

// Componente wrapper para manejar la navegación
function AppRoutes() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    console.log("Login exitoso, redirigiendo a dashboard...");
    setIsAuthenticated(true);
    navigate("/dashboard");
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

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <Login
            onSwitchToRegister={handleSwitchToRegister}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            onLoginSuccess={handleLoginSuccess}
          />
        }
      />
      <Route
        path="/register"
        element={<Register onSwitchToLogin={handleSwitchToLogin} />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword onSwitchToLogin={handleSwitchToLogin} />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword onSwitchToLogin={handleSwitchToLogin} />}
      />

      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/profesionales"
        element={isAuthenticated ? <Profesionales /> : <Navigate to="/login" />}
      />
      <Route
        path="/fichas"
        element={isAuthenticated ? <Fichas /> : <Navigate to="/login" />}
      />
      <Route
        path="/dashboard-proyectos"
        element={
          isAuthenticated ? <DashboardProyectos /> : <Navigate to="/login" />
        }
      />
      <Route
        path="/perfil"
        element={isAuthenticated ? <Perfil /> : <Navigate to="/login" />}
      />

      {/* Ruta por defecto */}
      <Route path="/" element={<Navigate to="/login" />} />
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

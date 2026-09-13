import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, getDefaultPathForRole } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Páginas
import { LoginPage } from './pages/LoginPage';
import { OperarioEstacionPage } from './pages/operario/OperarioEstacionPage';
import { SupervisorDashboardPage } from './pages/supervisor/SupervisorDashboardPage';
import { AdminConfiguracionPage } from './pages/admin/AdminConfiguracionPage';

// Redirección inteligente en la raíz '/'
const HomeRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultPathForRole(user.rol)} replace />;
};

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Barra de Navegación Global con Badge de Estado de API & Neon Cloud */}
      <Navbar />

      {/* Contenedor Principal */}
      <main className="flex-1">
        <Routes>
          {/* Ruta Raíz */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Ruta Pública: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas: Estación de Operario */}
          <Route
            path="/operario/estacion"
            element={
              <ProtectedRoute allowedRoles={['OPERARIO', 'ADMIN']}>
                <OperarioEstacionPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas Protegidas: Dashboard de Supervisión */}
          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN']}>
                <SupervisorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas Protegidas: Configuración Maestra de Administrador */}
          <Route
            path="/admin/configuracion"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminConfiguracionPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback para cualquier otra ruta */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </main>

      {/* Footer Industrial Discreto */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-3 text-center text-[11px] font-mono text-slate-500">
        NutriScan Calidad 4.0 • KIT AVZ-02 • PostgreSQL Neon Cloud & Express REST API
      </footer>
    </div>
  );
};

export default App;

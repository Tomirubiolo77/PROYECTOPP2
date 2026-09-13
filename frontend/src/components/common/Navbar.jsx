import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDefaultPathForRole } from '../../context/AuthContext';
import { healthService } from '../../services/api';
import { 
  Activity, 
  LogOut, 
  Shield, 
  User, 
  Radio, 
  Server, 
  Layers, 
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [healthStatus, setHealthStatus] = useState({
    online: false,
    checking: true,
    dbConnected: false,
    serverTime: null,
    uptime: null,
  });

  // Sondeo de conectividad de la API y PostgreSQL en Neon Cloud
  const checkServerHealth = async () => {
    try {
      const data = await healthService.check();
      if (data && data.success && data.database?.connected) {
        setHealthStatus({
          online: true,
          checking: false,
          dbConnected: true,
          serverTime: data.database.serverTime,
          uptime: data.uptimeSeconds,
        });
      } else {
        setHealthStatus({
          online: true,
          checking: false,
          dbConnected: false,
          serverTime: null,
          uptime: null,
        });
      }
    } catch (err) {
      setHealthStatus({
        online: false,
        checking: false,
        dbConnected: false,
        serverTime: null,
        uptime: null,
      });
    }
  };

  useEffect(() => {
    checkServerHealth();
    // Sondeo cada 20 segundos
    const interval = setInterval(checkServerHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (rol) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'SUPERVISOR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'OPERARIO':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Marca NutriScan y KIT 4.0 */}
        <div className="flex items-center space-x-4">
          <Link 
            to={getDefaultPathForRole(user?.rol)}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  Nutri<span className="text-cyan-400">Scan</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 border border-slate-700 rounded">
                  4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
                KIT AVZ-02 • Control de Calidad
              </p>
            </div>
          </Link>

          {/* Navegación según Rol */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800 text-sm">
              {user.rol === 'OPERARIO' && (
                <Link
                  to="/operario/estacion"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname.startsWith('/operario')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Estación de Línea
                </Link>
              )}

              {user.rol === 'SUPERVISOR' && (
                <Link
                  to="/supervisor/dashboard"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname.startsWith('/supervisor')
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Dashboard de Supervisión
                </Link>
              )}

              {user.rol === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/configuracion"
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Configuración Maestra
                  </Link>
                  <Link
                    to="/supervisor/dashboard"
                    className="px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    Vista Supervisión
                  </Link>
                  <Link
                    to="/operario/estacion"
                    className="px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    Vista Estación
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Indicador de Conectividad y Perfil de Usuario */}
        <div className="flex items-center space-x-3">
          
          {/* Badge en vivo de Salud de la API & Neon Cloud */}
          <button
            onClick={checkServerHealth}
            title={healthStatus.online ? 'Haga clic para refrescar diagnóstico de salud' : 'Reintentar conexión'}
            className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
              healthStatus.online && healthStatus.dbConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-glow-emerald hover:bg-emerald-900/40'
                : healthStatus.online && !healthStatus.dbConnected
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400 hover:bg-amber-900/40'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400 shadow-glow-rose hover:bg-rose-900/40'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  healthStatus.online && healthStatus.dbConnected
                    ? 'bg-emerald-400'
                    : healthStatus.online
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  healthStatus.online && healthStatus.dbConnected
                    ? 'bg-emerald-500'
                    : healthStatus.online
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="hidden sm:inline">
              {healthStatus.checking
                ? 'Comprobando API...'
                : healthStatus.online && healthStatus.dbConnected
                ? 'API Online (Neon Cloud)'
                : healthStatus.online
                ? 'API Degradada (Sin BD)'
                : 'API Desconectada'}
            </span>
          </button>

          {/* Perfil de Usuario y Logout */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="flex items-center space-x-2 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.nombre || user.email}
                  </p>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono border ${getRoleBadgeStyle(user.rol)}`}>
                    {user.rol}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-900/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
          )}

        </div>

      </div>
    </header>
  );
};

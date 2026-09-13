import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDefaultPathForRole } from '../context/AuthContext';
import { 
  Activity, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  KeyRound, 
  UserCheck, 
  Cpu, 
  Radio 
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirección si venía de un intento no autorizado
  const unauthorizedNotice = location.state?.unauthorizedAttempt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor complete su correo electrónico y contraseña.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const usuario = await login(email.trim(), password);
      // Redirección automática según el rol asignado
      const targetPath = getDefaultPathForRole(usuario.rol);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  // Botones de Acceso Rápido ("Chips") para evaluación docente
  const autofillUser = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Tarjeta de Login */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
          
          {/* Acento Superior */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

          {/* Header del Formulario */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3 shadow-glow-cyan">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase">
              Control de Acceso 4.0
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              NutriScan — Sistema de Inspección y Registro de Calidad
            </p>
          </div>

          {/* Alerta de intento no autorizado si viene redirigido */}
          {unauthorizedNotice && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>Acceso denegado: su rol no tiene permisos para esa ruta.</span>
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@nutriscan.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña de Seguridad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center space-x-2 shadow-glow-cyan transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <LoadingSpinner size="sm" text="AUTENTICANDO..." />
              ) : (
                <>
                  <span>INGRESAR A PLANTA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* CHIPS DE ACCESO RÁPIDO PARA TESTING DOCENTE */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>Acceso Rápido (Chips de Demostración)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Clave: 123456</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Chip Operario */}
              <button
                type="button"
                onClick={() => autofillUser('operario@nutriscan.com')}
                className="p-2 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 text-left transition-all cursor-pointer group"
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-tight flex items-center justify-between">
                  <span>Operario</span>
                  <UserCheck className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                  Estación Línea
                </div>
              </button>

              {/* Chip Supervisor */}
              <button
                type="button"
                onClick={() => autofillUser('supervisor@nutriscan.com')}
                className="p-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 text-left transition-all cursor-pointer group"
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-tight flex items-center justify-between">
                  <span>Supervisor</span>
                  <UserCheck className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                  Dashboard Control
                </div>
              </button>

              {/* Chip Admin */}
              <button
                type="button"
                onClick={() => autofillUser('admin@nutriscan.com')}
                className="p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-left transition-all cursor-pointer group"
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-tight flex items-center justify-between">
                  <span>Admin</span>
                  <UserCheck className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                  Configuración
                </div>
              </button>
            </div>
          </div>

          {/* Footer de Seguridad */}
          <div className="mt-4 text-center">
            <p className="text-[10px] font-mono text-slate-500 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Sesión protegida por JWT (HS256) & RBAC</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

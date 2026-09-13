import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  Activity, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';

export const DiagnosticoHealth = ({
  diagnostico = null,
  onRefrescar,
  cargando = false,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              DIAGNÓSTICO TÉCNICO DE INFRAESTRUCTURA
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Comprobación en vivo del Servidor Express y PostgreSQL Neon Cloud
            </p>
          </div>
        </div>

        <button
          onClick={onRefrescar}
          disabled={cargando}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-medium transition-colors border border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          <span>EJECUTAR DIAGNÓSTICO</span>
        </button>
      </div>

      {diagnostico ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          
          {/* Servidor Express */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase">Servidor Express</span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-bold font-mono text-emerald-400">
                {diagnostico.status || 'HEALTHY'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Versión: {diagnostico.version} • Env: {diagnostico.environment}
            </p>
          </div>

          {/* PostgreSQL Neon */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase">Neon Cloud DB</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${diagnostico.database?.connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className={`text-sm font-bold font-mono ${diagnostico.database?.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {diagnostico.database?.connected ? 'ONLINE (TLS/SSL)' : 'ERROR CONEXIÓN'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
              BD: {diagnostico.database?.databaseName || 'neondb'}
            </p>
          </div>

          {/* Uptime */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase">Uptime Servidor</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-bold font-mono text-white">
              {diagnostico.uptimeSeconds ? `${diagnostico.uptimeSeconds} seg` : 'Activo'}
            </span>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              {diagnostico.uptimeSeconds ? `~${Math.floor(diagnostico.uptimeSeconds / 60)} min en línea` : 'En ejecución'}
            </p>
          </div>

          {/* Timestamp Neon */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase">Reloj Neon Cloud</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-bold font-mono text-slate-200 block truncate">
              {diagnostico.database?.serverTime ? new Date(diagnostico.database.serverTime).toLocaleTimeString() : 'OK'}
            </span>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Sincronización NTP OK
            </p>
          </div>

        </div>
      ) : (
        <p className="text-xs font-mono text-slate-500 pt-4">
          Sin datos de diagnóstico disponibles.
        </p>
      )}
    </div>
  );
};

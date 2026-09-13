import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { 
  BellRing, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  Clock 
} from 'lucide-react';

export const BandejaAlertas = ({
  alertas = [],
  onAtenderAlerta,
  onRefrescar,
  cargando = false,
}) => {
  const [filtro, setFiltro] = useState('PENDIENTES'); // 'TODAS', 'PENDIENTES', 'ATENDIDAS'
  const [atendiendoId, setAtendiendoId] = useState(null);

  const handleAtender = async (id) => {
    setAtendiendoId(id);
    try {
      await onAtenderAlerta(id);
    } finally {
      setAtendiendoId(null);
    }
  };

  const alertasFiltradas = alertas.filter((a) => {
    if (filtro === 'PENDIENTES') return !a.atendida;
    if (filtro === 'ATENDIDAS') return a.atendida;
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header de la Bandeja */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              BANDEJA DE ALERTAS OPERATIVAS
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Eventos críticos y desvíos detectados por el KIT AVZ-02
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filtros */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {['PENDIENTES', 'ATENDIDAS', 'TODAS'].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filtro === f
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={onRefrescar}
            disabled={cargando}
            title="Refrescar alertas"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Listado de Alertas */}
      <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
        {alertasFiltradas.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No hay alertas en esta categoría"
            description="La línea de producción se encuentra operando dentro de los parámetros esperados."
          />
        ) : (
          alertasFiltradas.map((alerta) => (
            <div
              key={alerta.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                !alerta.atendida
                  ? 'bg-rose-950/10 hover:bg-rose-950/20'
                  : 'bg-slate-900/50 hover:bg-slate-800/40 opacity-75'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl border mt-0.5 ${
                  alerta.nivel === 'CRITICA'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      ALERTA #{alerta.id}
                    </span>
                    <StatusBadge type="severidad" value={alerta.nivel} />
                    {alerta.atendida ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>ATENDIDA</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>REQUIERE ATENCIÓN</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 font-mono">
                    {alerta.mensaje}
                  </p>

                  <div className="flex items-center space-x-4 mt-1.5 text-[11px] font-mono text-slate-500">
                    <span>
                      Hora: {new Date(alerta.created_at || Date.now()).toLocaleString()}
                    </span>
                    {alerta.inspeccion_id && (
                      <span>Inspección vinculada: #{alerta.inspeccion_id}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón de Acción */}
              {!alerta.atendida ? (
                <button
                  onClick={() => handleAtender(alerta.id)}
                  disabled={atendiendoId === alerta.id}
                  className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-glow-emerald disabled:opacity-50 flex-shrink-0 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{atendiendoId === alerta.id ? 'ATENDIENDO...' : 'ATENDER ALERTA'}</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500 italic pr-2">
                  Atendida
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

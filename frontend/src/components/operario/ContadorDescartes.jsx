import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Hash, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const ContadorDescartes = ({
  resumen = {
    total_unidades: 0,
    unidades_aprobadas: 0,
    unidades_rechazadas: 0,
    tasa_defecto_porcentaje: 0,
  },
  recientes = [],
}) => {
  const tasa = Number(resumen.tasa_defecto_porcentaje || 0);

  // Semáforo de tasa de descarte
  const getTasaColor = () => {
    if (tasa <= 5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (tasa <= 15) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="space-y-4">
      {/* Cuadrícula de Contadores de Alto Impacto */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total Unidades */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Piezas</span>
            <Hash className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {resumen.total_unidades}
            </span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Inspecciones lote</p>
          </div>
        </div>

        {/* Conformes / Aprobadas */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Conformes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
              {resumen.unidades_aprobadas}
            </span>
            <p className="text-[10px] text-emerald-500/80 font-mono mt-0.5">Piezas liberadas</p>
          </div>
        </div>

        {/* Rechazadas / Descartes */}
        <div className="bg-slate-900/90 border border-rose-500/20 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Descartes</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-rose-400 tracking-tight">
              {resumen.unidades_rechazadas}
            </span>
            <p className="text-[10px] text-rose-500/80 font-mono mt-0.5">Piezas segregadas</p>
          </div>
        </div>

        {/* Tasa de Descarte */}
        <div className={`rounded-xl p-3.5 border flex flex-col justify-between ${getTasaColor()}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider">% Descarte</span>
            <Percent className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono tracking-tight">
              {tasa.toFixed(1)}%
            </span>
            <p className="text-[10px] font-mono mt-0.5 opacity-80">
              {tasa <= 5 ? 'En rango óptimo' : tasa <= 15 ? 'Alerta preventiva' : 'Crítico: fuera de norma'}
            </p>
          </div>
        </div>

      </div>

      {/* Historial Reciente de la Estación */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-950/70 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Últimas Piezas del Lote en Línea
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {recientes.length} registros en memoria
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-52 overflow-y-auto">
          {recientes.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-mono">
              Aún no hay capturas registradas en este lote.
            </div>
          ) : (
            recientes.map((ins) => (
              <div
                key={ins.id}
                className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-500 text-[11px]">
                    #{ins.id}
                  </span>
                  <StatusBadge type="estado" value={ins.estado} />
                  {ins.tipos_defecto ? (
                    <span className="text-rose-300 font-mono text-[11px]">
                      [{ins.tipos_defecto.codigo}] {ins.tipos_defecto.nombre}
                    </span>
                  ) : (
                    <span className="text-emerald-400/80 font-mono text-[11px]">
                      Conforme
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                  <span>{new Date(ins.created_at || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

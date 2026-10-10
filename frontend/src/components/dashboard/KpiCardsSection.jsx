import React from 'react';
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Timer,
  TrendingDown,
  TrendingUp,
  Activity
} from 'lucide-react';

export const KpiCardsSection = ({ kpis = {} }) => {
  const {
    total_procesado = 0,
    aprobados = 0,
    rechazados = 0,
    tasa_descarte = 0,
    tasa_aprobacion = 0,
    tiempo_promedio_seg = 1.8,
  } = kpis;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      
      {/* 1. Total Procesado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Procesado</span>
          <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black font-mono text-white">
            {total_procesado.toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Piezas inspeccionadas
          </p>
        </div>
      </div>

      {/* 2. Piezas Aprobadas */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Conformes</span>
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black font-mono text-emerald-400">
            {aprobados.toLocaleString()}
          </span>
          <p className="text-[10px] text-emerald-500/80 font-mono mt-0.5 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 inline" />
            <span>{tasa_aprobacion}% de conformidad</span>
          </p>
        </div>
      </div>

      {/* 3. Piezas Rechazadas */}
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Descartes</span>
          <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black font-mono text-rose-400">
            {rechazados.toLocaleString()}
          </span>
          <p className="text-[10px] text-rose-500/80 font-mono mt-0.5">
            Separadas por actuadores
          </p>
        </div>
      </div>

      {/* 4. Tasa de Descarte (%) */}
      <div className={`border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-colors ${
        tasa_descarte > 15
          ? 'bg-rose-950/20 border-rose-500/50 shadow-glow-rose'
          : tasa_descarte > 5
          ? 'bg-amber-950/20 border-amber-500/40'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-300">
            Tasa de Descarte
          </span>
          <div className={`p-1.5 rounded-lg ${
            tasa_descarte > 15
              ? 'bg-rose-500/20 text-rose-400'
              : tasa_descarte > 5
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-2xl font-black font-mono ${
            tasa_descarte > 15 ? 'text-rose-400' : tasa_descarte > 5 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {tasa_descarte}%
          </span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {tasa_descarte > 15 ? '🚨 Umbral crítico superado' : tasa_descarte > 5 ? '⚠️ Desvío moderado' : '✅ En tolerancia'}
          </p>
        </div>
      </div>

      {/* 5. Tiempo Promedio / Cadencia */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg col-span-2 lg:col-span-1 flex flex-col justify-between">
        <div className="flex items-center justify-between text-indigo-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Cadencia Ciclo</span>
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Timer className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black font-mono text-white">
            {tiempo_promedio_seg}s
          </span>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Por pieza en sensor AVZ-02
          </p>
        </div>
      </div>

    </div>
  );
};

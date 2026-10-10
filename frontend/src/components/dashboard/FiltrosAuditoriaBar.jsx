import React from 'react';
import { 
  Filter, 
  RotateCcw, 
  Calendar, 
  Package, 
  Layers 
} from 'lucide-react';

export const FiltrosAuditoriaBar = ({
  lotes = [],
  filtros = {},
  onCambiarFiltro,
  onLimpiarFiltros,
  cargando = false,
}) => {
  const {
    lote_id = '',
    tipo_envase = '',
    fecha_desde = '',
    fecha_hasta = '',
  } = filtros;

  const hayFiltrosActivos = Boolean(lote_id || tipo_envase || fecha_desde || fecha_hasta);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
            Filtros Multidimensionales de Auditoría
          </span>
        </div>

        {hayFiltrosActivos && (
          <button
            onClick={onLimpiarFiltros}
            disabled={cargando}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-400 hover:text-cyan-400 text-xs font-mono rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        
        {/* Filtro: Por Lote */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] flex items-center space-x-1">
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filtrar por Lote:</span>
          </label>
          <select
            value={lote_id}
            onChange={(e) => onCambiarFiltro('lote_id', e.target.value)}
            disabled={cargando}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">TODOS LOS LOTES</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo_lote} ({l.tipo_envase} - {l.estado})
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Por Envase */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Línea / Envase:</span>
          </label>
          <select
            value={tipo_envase}
            onChange={(e) => onCambiarFiltro('tipo_envase', e.target.value)}
            disabled={cargando}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">TODOS LOS ENVASES</option>
            <option value="FRASCO">FRASCO DE VIDRIO</option>
            <option value="LATA">LATA METÁLICA</option>
          </select>
        </div>

        {/* Filtro: Fecha Desde */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Fecha y Hora Desde:</span>
          </label>
          <input
            type="datetime-local"
            value={fecha_desde}
            onChange={(e) => onCambiarFiltro('fecha_desde', e.target.value)}
            disabled={cargando}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filtro: Fecha Hasta */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>Fecha y Hora Hasta:</span>
          </label>
          <input
            type="datetime-local"
            value={fecha_hasta}
            onChange={(e) => onCambiarFiltro('fecha_hasta', e.target.value)}
            disabled={cargando}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

      </div>
    </div>
  );
};

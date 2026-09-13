import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { FileSpreadsheet, Search, Filter, RefreshCw } from 'lucide-react';

export const TablaAuditoria = ({
  inspecciones = [],
  lotes = [],
  filtroLote = '',
  filtroEstado = '',
  onCambiarFiltroLote,
  onCambiarFiltroEstado,
  onRefrescar,
  cargando = false,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Header y Filtros */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              REGISTRO Y AUDITORÍA DE INSPECCIONES
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Trazabilidad 100% persistida en PostgreSQL Neon Cloud
            </p>
          </div>
        </div>

        {/* Controles de Filtro */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Selector de Lote */}
          <select
            value={filtroLote}
            onChange={(e) => onCambiarFiltroLote(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">TODOS LOS LOTES</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo_lote} ({l.tipo_envase})
              </option>
            ))}
          </select>

          {/* Selector de Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => onCambiarFiltroEstado(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">TODOS LOS ESTADOS</option>
            <option value="APROBADO">SOLO APROBADOS</option>
            <option value="RECHAZADO">SOLO RECHAZADOS</option>
          </select>

          <button
            onClick={onRefrescar}
            disabled={cargando}
            title="Refrescar auditoría"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {inspecciones.length === 0 ? (
          <EmptyState
            title="No hay registros de inspección"
            description="No se encontraron inspecciones registradas con los filtros seleccionados."
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Lote</th>
                <th className="py-3 px-4">Envase</th>
                <th className="py-3 px-4">Operario</th>
                <th className="py-3 px-4">Resultado</th>
                <th className="py-3 px-4">Defecto Detectado</th>
                <th className="py-3 px-4">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {inspecciones.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-4 font-bold text-slate-400">
                    #{row.id}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {new Date(row.created_at || Date.now()).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-cyan-400">
                    {row.lotes?.codigo_lote || row.lote_id}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge type="envase" value={row.lotes?.tipo_envase || 'FRASCO'} />
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 font-sans font-medium">
                    {row.usuarios?.nombre || `Usuario #${row.usuario_id}`}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge type="estado" value={row.estado} />
                  </td>
                  <td className="py-2.5 px-4">
                    {row.tipos_defecto ? (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-rose-400 font-bold">
                          [{row.tipos_defecto.codigo}]
                        </span>
                        <span className="text-slate-300">{row.tipos_defecto.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Ninguno</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">
                    {row.observacion || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

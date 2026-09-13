import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';

export const CatalogoDefectos = ({
  defectos = [],
  onNuevoDefecto,
  onEditarDefecto,
  onEliminarDefecto,
  onRefrescar,
  cargando = false,
}) => {
  const [eliminandoId, setEliminandoId] = useState(null);
  const [confirmandoEliminacionId, setConfirmandoEliminacionId] = useState(null);

  const handleConfirmarEliminar = async (id) => {
    setEliminandoId(id);
    try {
      await onEliminarDefecto(id);
      setConfirmandoEliminacionId(null);
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              CATÁLOGO DE TIPOS DE DEFECTO
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Gestión maestra (ABM) sincronizada con la base de datos PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefrescar}
            disabled={cargando}
            title="Refrescar catálogo"
            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <button
            onClick={onNuevoDefecto}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO DEFECTO</span>
          </button>
        </div>
      </div>

      {/* Tabla de Defectos */}
      <div className="overflow-x-auto">
        {defectos.length === 0 ? (
          <EmptyState
            title="Catálogo sin defectos configurados"
            description="Presione 'Nuevo Defecto' para dar de alta los criterios de inspección."
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Línea Envase</th>
                <th className="py-3 px-4">Severidad</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {defectos.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-400">
                    {d.codigo}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200 font-sans">
                    {d.nombre}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="envase" value={d.tipo_envase} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="severidad" value={d.severidad} />
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-sm truncate">
                    {d.descripcion || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {confirmandoEliminacionId === d.id ? (
                      <div className="flex items-center justify-end space-x-1">
                        <span className="text-[10px] text-rose-400 mr-1">¿Borrar?</span>
                        <button
                          onClick={() => handleConfirmarEliminar(d.id)}
                          disabled={eliminandoId === d.id}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-500 cursor-pointer"
                        >
                          SÍ
                        </button>
                        <button
                          onClick={() => setConfirmandoEliminacionId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] hover:bg-slate-700 cursor-pointer"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEditarDefecto(d)}
                          title="Editar defecto"
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmandoEliminacionId(d.id)}
                          title="Eliminar defecto"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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

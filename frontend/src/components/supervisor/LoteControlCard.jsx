import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Package, 
  CheckCircle, 
  StopCircle, 
  PlusCircle, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

export const LoteControlCard = ({
  lote,
  onFinalizarLote,
  onAbrirModalNuevoLote,
  procesando = false,
}) => {
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  const handleConfirmarFinalizar = async () => {
    if (!lote) return;
    await onFinalizarLote(lote.id);
    setConfirmandoCierre(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                {lote ? lote.codigo_lote : 'Sin Lote Activo'}
              </h3>
              {lote && <StatusBadge type="estado" value={lote.estado} />}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {lote ? `Producto: ${lote.producto}` : 'No hay producción en curso'}
            </p>
          </div>
        </div>

        {/* Botones de Control de Lote */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {lote ? (
            confirmandoCierre ? (
              <div className="flex items-center space-x-2 w-full sm:w-auto animate-in fade-in">
                <span className="text-xs text-rose-400 font-mono font-medium">
                  ¿Confirmar fin de turno?
                </span>
                <button
                  onClick={handleConfirmarFinalizar}
                  disabled={procesando}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                >
                  SÍ, CERRAR
                </button>
                <button
                  onClick={() => setConfirmandoCierre(false)}
                  disabled={procesando}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmandoCierre(true)}
                disabled={procesando}
                className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-600/40 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer"
              >
                <StopCircle className="w-4 h-4 text-rose-400" />
                <span>FINALIZAR LOTE / TURNO</span>
              </button>
            )
          ) : (
            <button
              onClick={onAbrirModalNuevoLote}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-glow-cyan cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>APERTURAR NUEVO LOTE</span>
            </button>
          )}

          {lote && (
            <button
              onClick={onAbrirModalNuevoLote}
              title="Abrir otro lote"
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Detalles del lote en curso */}
      {lote ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Línea de Envasado</span>
            <span className="text-xs font-mono text-cyan-400 font-semibold">{lote.tipo_envase}</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Apertura</span>
            <span className="text-xs font-mono text-slate-300">
              {new Date(lote.created_at || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Supervisor Creador</span>
            <span className="text-xs font-mono text-slate-300">
              {lote.usuarios?.nombre || 'Supervisor Turno'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Estado Operativo</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>EN INSPECCIÓN</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="pt-4 flex items-center space-x-2 text-xs text-amber-400 font-mono">
          <AlertCircle className="w-4 h-4" />
          <span>No hay un lote en proceso. Haga clic en Aperturar Nuevo Lote para comenzar el turno.</span>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Package, 
  CheckCircle, 
  StopCircle, 
  PlusCircle, 
  Calendar, 
  AlertCircle,
  FileCheck,
  Check,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const LoteControlCard = ({
  lote,
  onFinalizarLote,
  onReanudarLote,
  onAbrirModalNuevoLote,
  procesando = false,
}) => {
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  const handleConfirmarFinalizar = async () => {
    if (!lote) return;
    await onFinalizarLote(lote.id);
    setConfirmandoCierre(false);
  };

  const esPendienteCierre = lote && lote.estado === 'PENDIENTE_CIERRE';
  const esDetenido = lote && lote.estado === 'DETENIDO';

  return (
    <div className={`border rounded-2xl p-5 shadow-xl transition-all ${
      esDetenido
        ? 'bg-rose-950/20 border-rose-500/50 shadow-glow-rose'
        : esPendienteCierre
        ? 'bg-amber-950/20 border-amber-500/50 shadow-glow-amber'
        : 'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${
            esDetenido
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
              : esPendienteCierre
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-cyan-500/10 border-cyan-500/30 rounded-xl text-cyan-400'
          }`}>
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
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  {esPendienteCierre ? '¿Aprobar y dar visto bueno?' : '¿Confirmar cierre de turno?'}
                </span>
                <button
                  onClick={handleConfirmarFinalizar}
                  disabled={procesando}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                >
                  SÍ, APROBAR
                </button>
                <button
                  onClick={() => setConfirmandoCierre(false)}
                  disabled={procesando}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>
            ) : esDetenido ? (
              <button
                onClick={() => onReanudarLote && onReanudarLote(lote.id)}
                disabled={procesando}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/40 rounded-xl text-xs font-mono font-bold transition-all shadow-glow-emerald cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>ATENDER Y REANUDAR LÍNEA</span>
              </button>
            ) : esPendienteCierre ? (
              <button
                onClick={() => setConfirmandoCierre(true)}
                disabled={procesando}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/40 rounded-xl text-xs font-mono font-bold transition-all shadow-glow-emerald cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>DAR VISTO BUENO Y APROBAR CIERRE</span>
              </button>
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

      {/* Banner de Parada de Emergencia si está DETENIDO */}
      {esDetenido && (
        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center space-x-3">
          <StopCircle className="w-5 h-5 flex-shrink-0 text-rose-400 animate-pulse" />
          <span>
            <strong>🚨 PARADA DE EMERGENCIA EN LÍNEA:</strong> La producción está detenida. El operario ha reportado un incidente crítico. Verifique la causa y haga clic en <strong>Atender y Reanudar Línea</strong> para habilitar la continuidad del proceso.
          </span>
        </div>
      )}

      {/* Banner de Revisión y Visto Bueno si está PENDIENTE_CIERRE */}
      {esPendienteCierre && (
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono flex items-center space-x-3">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-400 animate-pulse" />
          <span>
            <strong>El Operario ha cerrado este lote:</strong> Revise los resultados de inspección, rechazos y alertas atendidas. Si todo es conforme, haga clic en <strong>Dar Visto Bueno y Aprobar Cierre</strong> para finalizarlo formalmente.
          </span>
        </div>
      )}

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
              {new Date(lote.fecha_inicio || lote.created_at || Date.now()).toLocaleTimeString()}
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
            <span className={`text-xs font-mono flex items-center space-x-1 ${
              esPendienteCierre ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${esPendienteCierre ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{esPendienteCierre ? 'PENDIENTE DE APROBACIÓN' : 'EN INSPECCIÓN'}</span>
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

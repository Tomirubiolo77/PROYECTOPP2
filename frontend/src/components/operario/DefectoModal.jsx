import React, { useState, useEffect } from 'react';
import { tiposDefectoService } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  X, 
  AlertTriangle, 
  Camera, 
  Send, 
  Check, 
  FileText 
} from 'lucide-react';

export const DefectoModal = ({
  isOpen,
  onClose,
  onConfirmarRechazo,
  tipoEnvase = 'FRASCO',
  lote = null,
}) => {
  const [defectos, setDefectos] = useState([]);
  const [defectoSeleccionado, setDefectoSeleccionado] = useState(null);
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar catálogo de defectos en vivo desde GET /api/tipos-defecto
  useEffect(() => {
    if (!isOpen) return;

    const cargarDefectos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await tiposDefectoService.listar(tipoEnvase);
        if (response && response.success) {
          setDefectos(response.data || []);
          if (response.data && response.data.length > 0) {
            setDefectoSeleccionado(response.data[0]);
          }
        }
      } catch (err) {
        setError(err.message || 'Error al cargar catálogo de defectos.');
      } finally {
        setLoading(false);
      }
    };

    cargarDefectos();
  }, [isOpen, tipoEnvase]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!defectoSeleccionado) {
      setError('Por favor, seleccione un tipo de defecto.');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await onConfirmarRechazo({
        tipo_defecto_id: defectoSeleccionado.id,
        observacion: observacion.trim() || `Falla detectada por operador: ${defectoSeleccionado.nombre}`,
        imagen_url: `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80`, // Simulación fotográfica de pieza
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar la inspección rechazada.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-rose-500/50 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header del Modal */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                REGISTRO DE DEFECTO Y RECHAZO
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Lote activo: <span className="text-cyan-400">{lote?.codigo_lote}</span> • Línea: <span className="text-amber-400">{tipoEnvase}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={enviando}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <LoadingSpinner text="Consultando catálogo en vivo de la API..." />
          ) : (
            <>
              {/* Selección del Tipo de Defecto (Tarjetas táctiles) */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Seleccione el Defecto Observado (Catálogo en vivo)
                </label>

                {defectos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No hay tipos de defecto registrados para el tipo de envase {tipoEnvase}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {defectos.map((d) => {
                      const isSelected = defectoSeleccionado?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setDefectoSeleccionado(d)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-rose-950/40 border-rose-500 shadow-glow-rose'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {d.codigo}
                            </span>
                            <StatusBadge type="severidad" value={d.severidad} />
                          </div>

                          <div className="mt-2">
                            <h4 className="text-sm font-semibold text-slate-200 leading-tight">
                              {d.nombre}
                            </h4>
                            {d.descripcion && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                {d.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Observación adicional del Operario */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Observación de Línea (Opcional)</span>
                </label>
                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej: Deformación visible en el borde superior derecho..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>

              {/* Aviso de Disparo de Alerta */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-3 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>
                  <strong>Atención:</strong> Registrar este defecto generará automáticamente una <strong>Alerta Operativa</strong> en la bandeja del Supervisor de Calidad.
                </span>
              </div>
            </>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              CANCELAR
            </button>

            <button
              type="submit"
              disabled={enviando || loading || !defectoSeleccionado}
              className="btn-tactile flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl border border-rose-400/50 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {enviando ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  <span>REGISTRANDO EN API...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>CONFIRMAR Y DISPARAR ALERTA</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

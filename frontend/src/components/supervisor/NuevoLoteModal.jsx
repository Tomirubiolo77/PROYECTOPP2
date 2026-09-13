import React, { useState } from 'react';
import { X, PackagePlus, Send, AlertCircle } from 'lucide-react';

export const NuevoLoteModal = ({
  isOpen,
  onClose,
  onCrearLote,
  procesando = false,
}) => {
  const [codigoLote, setCodigoLote] = useState(`LOTE-${Date.now().toString().slice(-5)}`);
  const [producto, setProducto] = useState('Mermelada de Arándanos 500g');
  const [tipoEnvase, setTipoEnvase] = useState('FRASCO');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigoLote.trim()) {
      setError('El código de lote es obligatorio.');
      return;
    }
    if (!producto.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    setError(null);
    try {
      await onCrearLote({
        codigo_lote: codigoLote.trim(),
        producto: producto.trim(),
        tipo_envase: tipoEnvase,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear nuevo lote de producción.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                APERTURA DE NUEVO LOTE
              </h3>
              <p className="text-xs font-mono text-slate-400">NutriScan Calidad 4.0</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={procesando}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Código de Lote
            </label>
            <input
              type="text"
              value={codigoLote}
              onChange={(e) => setCodigoLote(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Producto
            </label>
            <input
              type="text"
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              required
              placeholder="Ej: Mermelada Frutilla 500g"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Línea de Envase
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoEnvase('FRASCO')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  tipoEnvase === 'FRASCO'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-glow-cyan'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                FRASCO DE VIDRIO
              </button>
              <button
                type="button"
                onClick={() => setTipoEnvase('LATA')}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  tipoEnvase === 'LATA'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                LATA METÁLICA
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={procesando}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-glow-cyan disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>APERTURAR LOTE</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

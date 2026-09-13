import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Tag } from 'lucide-react';

export const DefectoCrudModal = ({
  isOpen,
  onClose,
  onGuardar,
  defectoAEditar = null,
  procesando = false,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipoEnvase, setTipoEnvase] = useState('FRASCO');
  const [severidad, setSeveridad] = useState('MEDIA');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (defectoAEditar) {
      setCodigo(defectoAEditar.codigo || '');
      setNombre(defectoAEditar.nombre || '');
      setTipoEnvase(defectoAEditar.tipo_envase || 'FRASCO');
      setSeveridad(defectoAEditar.severidad || 'MEDIA');
      setDescripcion(defectoAEditar.descripcion || '');
    } else {
      setCodigo(`DEF-${Math.floor(100 + Math.random() * 900)}`);
      setNombre('');
      setTipoEnvase('FRASCO');
      setSeveridad('MEDIA');
      setDescripcion('');
    }
    setError(null);
  }, [defectoAEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      setError('El código y el nombre del defecto son obligatorios.');
      return;
    }

    setError(null);
    try {
      await onGuardar({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        tipo_envase: tipoEnvase,
        severidad,
        descripcion: descripcion.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el tipo de defecto en la base de datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {defectoAEditar ? 'EDITAR TIPO DE DEFECTO' : 'NUEVO TIPO DE DEFECTO'}
              </h3>
              <p className="text-xs font-mono text-slate-400">Catálogo Maestro NutriScan</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Código Único
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                placeholder="Ej: DEF-101"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Línea de Envase
              </label>
              <select
                value={tipoEnvase}
                onChange={(e) => setTipoEnvase(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="FRASCO">FRASCO</option>
                <option value="LATA">LATA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre del Defecto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej: Tapa Fisurada / Abolladura Lateral"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nivel de Severidad
            </label>
            <select
              value={severidad}
              onChange={(e) => setSeveridad(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="LEVE">LEVE (Desvío cosmético menor)</option>
              <option value="MEDIA">MEDIA (Incumplimiento de tolerancia estándar)</option>
              <option value="CRITICA">CRÍTICA (Riesgo de inocuidad o hermeticidad)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Descripción Técnica
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Criterios para detección por visión artificial..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
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
              className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{defectoAEditar ? 'ACTUALIZAR DEFECTO' : 'CREAR DEFECTO'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

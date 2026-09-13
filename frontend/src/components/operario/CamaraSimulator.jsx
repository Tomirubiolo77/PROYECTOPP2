import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Crosshair, 
  Maximize2, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export const CamaraSimulator = ({
  tipoEnvase = 'FRASCO',
  loteActivo = null,
  onPiezaConforme,
  onRegistrarDefecto,
  procesando = false,
  ultimaInspeccion = null,
}) => {
  const [flashState, setFlashState] = useState(null); // 'success', 'danger', null
  const [fps, setFps] = useState(30);

  // Fluctuación ligera de FPS para realismo de cámara industrial
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(28 + Math.random() * 4));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConformeClick = async () => {
    if (procesando || !loteActivo) return;
    setFlashState('success');
    await onPiezaConforme();
    setTimeout(() => setFlashState(null), 800);
  };

  const handleDefectoClick = () => {
    if (procesando || !loteActivo) return;
    setFlashState('danger');
    onRegistrarDefecto();
    setTimeout(() => setFlashState(null), 800);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header del Visor */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Sensor Óptico AVZ-02 — Línea {tipoEnvase}
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Resolución: 1080p • {fps} FPS • Exposición: Auto • Matriz IA 4.0
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>STREAM ACTIVO</span>
          </span>
        </div>
      </div>

      {/* Pantalla Simuladora de Cámara (Viewfinder con retículo) */}
      <div className={`relative aspect-video bg-black flex items-center justify-center overflow-hidden border-2 transition-colors duration-300 ${
        flashState === 'success'
          ? 'border-emerald-500 shadow-glow-emerald'
          : flashState === 'danger'
          ? 'border-rose-500 shadow-glow-rose'
          : 'border-slate-800'
      }`}>
        
        {/* Línea de escaneo láser animada */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-scanline" />
        </div>

        {/* Retículo de Apuntado y Marcadores Tácticos */}
        <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start text-cyan-500/60 font-mono text-[10px]">
            <div>
              <p>CAM: 01-OPTIC</p>
              <p>LOTE: {loteActivo ? loteActivo.codigo_lote : 'SIN LOTE ACTIVO'}</p>
            </div>
            <div className="text-right">
              <p>ZONA DE INSPECCIÓN #1</p>
              <p>ISO: 400 • SHUTTER: 1/1200</p>
            </div>
          </div>

          {/* Esquinas tácticas */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-400/80" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-400/80" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-400/80" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-400/80" />

          {/* Centro de mira */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-48 border border-dashed border-cyan-500/40 rounded-full flex items-center justify-center">
              <Crosshair className="w-10 h-10 text-cyan-400/70" />
              <div className="absolute top-0 w-2 h-2 bg-cyan-400 rounded-full" />
              <div className="absolute bottom-0 w-2 h-2 bg-cyan-400 rounded-full" />
              <div className="absolute left-0 w-2 h-2 bg-cyan-400 rounded-full" />
              <div className="absolute right-0 w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
          </div>

          <div className="flex justify-between items-end text-cyan-500/60 font-mono text-[10px]">
            <p>AVZ-02 HARDWARE OK</p>
            <p className="text-slate-400">NUTRISCAN CALIDAD 4.0</p>
          </div>
        </div>

        {/* Representación visual de la pieza inspeccionada */}
        <div className="text-center z-10 p-6 bg-slate-950/60 backdrop-blur-sm rounded-xl border border-slate-800/80 max-w-sm">
          <div className="w-20 h-28 mx-auto mb-3 bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg border-2 border-slate-600 flex flex-col items-center justify-between p-2 shadow-lg">
            <div className={`w-12 h-3 rounded-t-md ${tipoEnvase === 'FRASCO' ? 'bg-amber-600' : 'bg-slate-400'}`} />
            <div className="w-full text-[9px] font-mono text-center text-slate-300 bg-slate-900/80 py-1 rounded">
              {tipoEnvase === 'FRASCO' ? 'FRASCO 500g' : 'LATA 350ml'}
            </div>
            <div className="w-8 h-1 bg-slate-500 rounded" />
          </div>

          <p className="text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase">
            {loteActivo ? `Pieza en posicionador (${tipoEnvase})` : 'Detenido — No hay lote en proceso'}
          </p>

          {ultimaInspeccion && (
            <div className="mt-2 inline-flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900 border border-slate-700">
              <span className="text-slate-400">Última inspección:</span>
              <span className={ultimaInspeccion.estado === 'APROBADO' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {ultimaInspeccion.estado}
              </span>
              {ultimaInspeccion.tipo_defecto && (
                <span className="text-rose-300 text-[11px]">
                  ({ultimaInspeccion.tipo_defecto.nombre})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Flash Overlay al capturar */}
        {flashState === 'success' && (
          <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none flex items-center justify-center">
            <div className="p-4 bg-emerald-950/90 border border-emerald-500 rounded-2xl flex items-center space-x-3 text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
              <span className="font-mono text-lg font-bold">PIEZA CONFORME APROBADA</span>
            </div>
          </div>
        )}

        {flashState === 'danger' && (
          <div className="absolute inset-0 bg-rose-500/20 pointer-events-none flex items-center justify-center">
            <div className="p-4 bg-rose-950/90 border border-rose-500 rounded-2xl flex items-center space-x-3 text-rose-400 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
              <span className="font-mono text-lg font-bold">FALLA REGISTRADA / RECHAZO</span>
            </div>
          </div>
        )}
      </div>

      {/* Botonera Táctil Industrial de Alta Visibilidad */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        {!loteActivo ? (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Línea sin lote en proceso:</strong> No se pueden registrar capturas hasta que el Supervisor abra un lote para la línea {tipoEnvase}.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Botón Táctil: PIEZA CONFORME */}
            <button
              onClick={handleConformeClick}
              disabled={procesando}
              className="btn-tactile group relative flex items-center justify-center space-x-3 py-5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-bold text-base tracking-wider uppercase border-2 border-emerald-400/40 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="p-2 bg-emerald-950/40 rounded-lg group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-lg leading-tight font-black tracking-wider">
                  PIEZA CONFORME
                </div>
                <div className="text-[11px] font-mono text-emerald-200 font-medium">
                  [Aprobado • Sin defectos]
                </div>
              </div>
            </button>

            {/* Botón Táctil: REGISTRAR DEFECTO */}
            <button
              onClick={handleDefectoClick}
              disabled={procesando}
              className="btn-tactile group relative flex items-center justify-center space-x-3 py-5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 active:to-red-700 text-white font-bold text-base tracking-wider uppercase border-2 border-rose-400/40 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="p-2 bg-rose-950/40 rounded-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-7 h-7 text-rose-300" />
              </div>
              <div className="text-left">
                <div className="text-lg leading-tight font-black tracking-wider">
                  REGISTRAR DEFECTO
                </div>
                <div className="text-[11px] font-mono text-rose-200 font-medium">
                  [Rechazar • Dispara Alerta]
                </div>
              </div>
            </button>

          </div>
        )}
      </div>

    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Crosshair, 
  RefreshCw, 
  Zap, 
  AlertCircle,
  Play,
  Square,
  FastForward,
  ShieldAlert,
  Sliders,
  Bell,
  Wrench,
  Check,
  RotateCcw
} from 'lucide-react';

export const CamaraSimulator = ({
  tipoEnvase = 'FRASCO',
  loteActivo = null,
  onPiezaConforme,
  onRegistrarDefecto,
  onDefectoDetectadoAutomatico,
  onNotificarParadaEmergencia,
  procesando = false,
  ultimaInspeccion = null,
  defectosDisponibles = [],
}) => {
  // Estado de simulación
  const [tandaActiva, setTandaActiva] = useState(false);
  const [tandaTamano, setTandaTamano] = useState(10); // 5, 10, 20 o 0 (continuo)
  const [tandaProgreso, setTandaProgreso] = useState(0);
  const [cadenciaSegundos, setCadenciaSegundos] = useState(1.8); // 1, 1.8, 3 segundos
  
  // Estado del actuador de rechazo mecánico
  const [actuadorActivo, setActuadorActivo] = useState(null); // 'PISTON', 'BRAZO', 'DESVIO', null
  const [mensajeRechazo, setMensajeRechazo] = useState(null);

  // Parada de Emergencia
  const [paradaEmergencia, setParadaEmergencia] = useState(null); // { motivo: string, tipo: 'CONSECUTIVAS'|'ATASCAMIENTO' }
  const [consecutivasFallas, setConsecutivasFallas] = useState(0);
  const [notificacionSupervisorEnviada, setNotificacionSupervisorEnviada] = useState(false);
  const [notificandoSupervisor, setNotificandoSupervisor] = useState(false);

  // Estado visual del envase actual inspeccionado
  const [envaseActual, setEnvaseActual] = useState({
    estado: 'CONFORME', // 'CONFORME', 'DEFECTO'
    defecto: null, // Objeto de defecto
    subDefectoTipo: 'NORMAL', // 'SIN_TAPA', 'LLENADO_BAJO', 'SIN_ETIQUETA', 'FISURA', 'ABOLLADURA', 'OXIDO', 'ABOMBAMIENTO', 'ANILLA_ROTA'
  });

  const [flashState, setFlashState] = useState(null); // 'success', 'danger', null
  const [fps, setFps] = useState(30);
  const timerRef = useRef(null);

  // Fluctuación ligera de FPS para realismo de hardware industrial
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(28 + Math.random() * 4));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Detener tanda automática si el lote deja de estar en proceso
  useEffect(() => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') {
      detenerTanda();
    }
  }, [loteActivo]);

  // Selección de mecanismo de rechazo aleatorio entre los 3 pedidos por la cátedra
  const dispararMecanismoRechazo = (nombreDefecto) => {
    const mecanismos = [
      { tipo: 'PISTON', nombre: 'Pistón Neumático (6.2 bar)', desc: 'Actuador neumático expulsó envase defectuoso a tolva de rechazo' },
      { tipo: 'BRAZO', nombre: 'Brazo Expulsor Electromecánico', desc: 'Brazo desviador separó unidad no conforme del carril principal' },
      { tipo: 'DESVIO', nombre: 'Desviación de Carril Automática', desc: 'Compuerta servomotor activada hacia carril secundario de descartes' },
    ];
    const seleccionado = mecanismos[Math.floor(Math.random() * mecanismos.length)];
    setActuadorActivo(seleccionado);
    setMensajeRechazo(`${seleccionado.nombre}: ${seleccionado.desc} [Falla: ${nombreDefecto}]`);

    // Reset visual del actuador a los 2.5s
    setTimeout(() => {
      setActuadorActivo(null);
      setMensajeRechazo(null);
    }, 2500);

    return seleccionado;
  };

  // Simular un solo paso de inspección automática (aleatorio realista)
  const ejecutarPasoSimulacion = useCallback(async () => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO' || paradaEmergencia) {
      detenerTanda();
      return;
    }

    // 80% probabilidad Aprobado, 20% Defecto
    const esDefecto = Math.random() < 0.22;

    if (!esDefecto) {
      // PIEZA CONFORME
      setEnvaseActual({
        estado: 'CONFORME',
        defecto: null,
        subDefectoTipo: 'NORMAL'
      });
      setFlashState('success');
      setConsecutivasFallas(0);
      setTimeout(() => setFlashState(null), 700);

      if (onPiezaConforme) {
        await onPiezaConforme();
      }
    } else {
      // PIEZA CON DEFECTO
      // Seleccionar un defecto compatible con el envase actual
      const defectosFiltrados = defectosDisponibles.filter(d => 
        d.tipo_envase === tipoEnvase || d.tipo_envase === 'GENERAL'
      );

      const defectoElegido = defectosFiltrados.length > 0
        ? defectosFiltrados[Math.floor(Math.random() * defectosFiltrados.length)]
        : { id: 1, codigo: 'DEFECTO_GENERAL', nombre: 'Defecto detectado', severidad: 'MEDIA' };

      setEnvaseActual({
        estado: 'DEFECTO',
        defecto: defectoElegido,
        subDefectoTipo: defectoElegido.codigo || 'DEFECTO'
      });

      setFlashState('danger');
      setTimeout(() => setFlashState(null), 700);

      // Incrementar contador de fallas consecutivas
      const nuevasConsecutivas = consecutivasFallas + 1;
      setConsecutivasFallas(nuevasConsecutivas);

      // Disparar actuador de rechazo físico
      const actuador = dispararMecanismoRechazo(defectoElegido.nombre);

      // Registrar inspección con el actuador utilizado en la observación
      if (onDefectoDetectadoAutomatico) {
        await onDefectoDetectadoAutomatico({
          tipo_defecto_id: defectoElegido.id,
          observacion: `Rechazo automático por sensor AVZ-02. Actuador disparado: ${actuador.nombre}.`,
          imagen_url: `/simulador/${tipoEnvase.toLowerCase()}_${defectoElegido.codigo.toLowerCase()}.png`
        });
      }

      // REGLA DE PLANTA 1: Si son 3 fallas consecutivas -> PARADA DE EMERGENCIA
      if (nuevasConsecutivas >= 3) {
        activarParadaEmergencia('CONSECUTIVAS', `Detección crítica de ${nuevasConsecutivas} fallas consecutivas en línea`);
        return;
      }
    }

    setTandaProgreso(prev => prev + 1);
  }, [loteActivo, paradaEmergencia, defectosDisponibles, tipoEnvase, consecutivasFallas, onPiezaConforme, onDefectoDetectadoAutomatico]);

  // Manejador del bucle de tanda automática
  useEffect(() => {
    if (!tandaActiva || paradaEmergencia) return;

    if (tandaTamano > 0 && tandaProgreso >= tandaTamano) {
      detenerTanda();
      return;
    }

    timerRef.current = setTimeout(async () => {
      await ejecutarPasoSimulacion();
    }, cadenciaSegundos * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tandaActiva, tandaProgreso, tandaTamano, cadenciaSegundos, paradaEmergencia, ejecutarPasoSimulacion]);

  const iniciarTanda = () => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') return;
    if (paradaEmergencia) return;
    setTandaProgreso(0);
    setTandaActiva(true);
  };

  const detenerTanda = () => {
    setTandaActiva(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // REGLA DE PLANTA: Activar Parada de Emergencia
  const activarParadaEmergencia = (tipo, motivo) => {
    detenerTanda();
    setParadaEmergencia({ tipo, motivo });
    setNotificacionSupervisorEnviada(false);
  };

  // Simulación intencional de Atascamiento Mecánico (Requerimiento Cátedra)
  const simularAtascamientoMecanico = async () => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') return;
    
    // Configurar envase roto / trabado
    setEnvaseActual({
      estado: 'DEFECTO',
      defecto: {
        codigo: tipoEnvase === 'FRASCO' ? 'FISURA' : 'ABOMBAMIENTO',
        nombre: tipoEnvase === 'FRASCO' ? 'Envase fisurado y roto en cabezal' : 'Lata abombada atascada',
        severidad: 'CRITICA'
      },
      subDefectoTipo: tipoEnvase === 'FRASCO' ? 'FISURA' : 'ABOMBAMIENTO'
    });
    setFlashState('danger');

    activarParadaEmergencia(
      'ATASCAMIENTO', 
      `Atascamiento mecánico detectado en cinta transportadora (Envase no conforme obstruye el carril de paso)`
    );
  };

  // Simulación intencional de 3 fallas consecutivas para demostración docente
  const simularTresFallasDocente = async () => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') return;
    setConsecutivasFallas(3);
    activarParadaEmergencia(
      'CONSECUTIVAS',
      'Disparo de Parada de Emergencia: Detección crítica de 3 fallas consecutivas en línea'
    );
  };

  // Notificar al Supervisor ante la parada de emergencia
  const handleNotificarSupervisor = async () => {
    if (!paradaEmergencia || !onNotificarParadaEmergencia) return;
    setNotificandoSupervisor(true);
    try {
      await onNotificarParadaEmergencia({
        motivo: paradaEmergencia.motivo,
        tipo: paradaEmergencia.tipo,
        envase: tipoEnvase
      });
      setNotificacionSupervisorEnviada(true);
    } catch (err) {
      console.error('Error al notificar parada de emergencia:', err);
    } finally {
      setNotificandoSupervisor(false);
    }
  };

  // Reactivar línea / Reset de Parada
  const reactivarLinea = () => {
    setParadaEmergencia(null);
    setConsecutivasFallas(0);
    setNotificacionSupervisorEnviada(false);
    setActuadorActivo(null);
    setMensajeRechazo(null);
    setEnvaseActual({
      estado: 'CONFORME',
      defecto: null,
      subDefectoTipo: 'NORMAL'
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Header del Visor */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Sensor Óptico AVZ-02 — Puesto de Visión {tipoEnvase}
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Resolución: 1080p • {fps} FPS • Exposición: Auto • Ingestión 4.0
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {paradaEmergencia ? (
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>PARADA DE EMERGENCIA</span>
            </span>
          ) : tandaActiva ? (
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>INGESTIÓN AUTOMÁTICA ACTIVA</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>LISTO EN LÍNEA</span>
            </span>
          )}
        </div>
      </div>

      {/* Pantalla Simuladora de Cámara (Viewfinder con retículo) */}
      <div className={`relative aspect-video bg-black flex items-center justify-center overflow-hidden border-2 transition-colors duration-300 ${
        paradaEmergencia
          ? 'border-rose-600 bg-rose-950/20 shadow-glow-rose'
          : flashState === 'success'
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
        <div className="absolute inset-4 pointer-events-none flex flex-col justify-between z-10">
          <div className="flex justify-between items-start text-cyan-500/60 font-mono text-[10px]">
            <div>
              <p>CAM: 01-OPTIC-AVZ02</p>
              <p>LOTE: {loteActivo ? loteActivo.codigo_lote : 'SIN LOTE ACTIVO'}</p>
            </div>
            <div className="text-right">
              <p>ZONA DE INSPECCIÓN #1</p>
              <p>CADENCIA: {cadenciaSegundos}s • FALLAS CONSECUTIVAS: {consecutivasFallas}</p>
            </div>
          </div>

          {/* Esquinas tácticas */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-400/80" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-400/80" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-400/80" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-400/80" />

          {/* Centro de mira */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-44 h-44 border border-dashed border-cyan-500/40 rounded-full flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-cyan-400/60" />
            </div>
          </div>

          <div className="flex justify-between items-end text-cyan-500/60 font-mono text-[10px]">
            <p>AVZ-02 HARDWARE OK</p>
            <p className="text-slate-400">NUTRISCAN CALIDAD 4.0</p>
          </div>
        </div>

        {/* Banner Overlay de Mecanismo de Rechazo Automático Activo */}
        {actuadorActivo && !paradaEmergencia && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-amber-500/90 text-slate-950 rounded-xl font-mono text-xs font-black tracking-wider flex items-center space-x-2 shadow-2xl animate-bounce">
            <Zap className="w-4 h-4 text-slate-950" />
            <span>SISTEMA DE RECHAZO: {actuadorActivo.nombre} ACTIVADO</span>
          </div>
        )}

        {/* Representación Visual Gráfica del Envase (Dataset Visual Dinámico) */}
        <div className="text-center z-10 p-5 bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800/80 max-w-sm">
          
          {/* Gráfico Visual del Envase (FRASCO o LATA con detalles visuales según defecto) */}
          <div className="w-24 h-32 mx-auto mb-3 flex flex-col items-center justify-between p-2 shadow-2xl relative">
            
            {tipoEnvase === 'FRASCO' ? (
              // Gráfico Visual FRASCO
              <div className="w-full h-full flex flex-col items-center justify-between relative">
                {/* Tapa del frasco */}
                {envaseActual.subDefectoTipo === 'SIN_TAPA' ? (
                  <div className="w-14 h-3 border-2 border-dashed border-rose-500 bg-rose-500/20 rounded-t flex items-center justify-center">
                    <span className="text-[7px] text-rose-300 font-mono font-bold">SIN TAPA</span>
                  </div>
                ) : (
                  <div className="w-14 h-3 bg-amber-600 border border-amber-400 rounded-t shadow-sm" />
                )}

                {/* Cuello del frasco */}
                <div className="w-10 h-2 bg-slate-400/30 border-x border-slate-400" />

                {/* Cuerpo del frasco de vidrio */}
                <div className="w-20 h-22 border-2 border-slate-400/80 rounded-b-lg relative overflow-hidden bg-slate-900/40 flex flex-col justify-end p-1">
                  
                  {/* Líquido salsa (Nivel de llenado) */}
                  <div 
                    className={`w-full bg-gradient-to-t from-red-800 to-red-600 rounded-b transition-all duration-300 ${
                      envaseActual.subDefectoTipo === 'LLENADO_BAJO' ? 'h-9' : 'h-16'
                    }`}
                  />

                  {/* Indicador de Llenado Bajo */}
                  {envaseActual.subDefectoTipo === 'LLENADO_BAJO' && (
                    <div className="absolute top-2 left-0 right-0 border-t border-rose-400 border-dashed text-[7px] font-mono text-rose-300 bg-rose-950/80 text-center">
                      -30% NIVEL
                    </div>
                  )}

                  {/* Etiqueta del frasco */}
                  {envaseActual.subDefectoTipo === 'SIN_ETIQUETA' ? (
                    <div className="absolute inset-x-2 top-6 h-6 border border-dashed border-rose-400 bg-rose-500/10 flex items-center justify-center text-[7px] font-mono text-rose-300">
                      SIN ETIQUETA
                    </div>
                  ) : (
                    <div className="absolute inset-x-2 top-6 h-6 bg-slate-200/90 rounded border border-slate-300 flex items-center justify-center text-[7px] font-bold text-slate-800 font-sans shadow-sm">
                      NutriScan
                    </div>
                  )}

                  {/* Grieta / Fisura de vidrio */}
                  {envaseActual.subDefectoTipo === 'FISURA' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 border-l-2 border-b-2 border-rose-400 rotate-45 transform animate-ping" />
                      <span className="absolute text-[8px] font-mono font-bold text-rose-400 bg-rose-950/90 px-1 rounded">
                        FISURA
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Gráfico Visual LATA
              <div className="w-full h-full flex flex-col items-center justify-between relative">
                {/* Tapa superior de la lata con anilla */}
                <div className="w-16 h-3 bg-slate-400 border border-slate-300 rounded-t flex items-center justify-center relative">
                  {envaseActual.subDefectoTipo === 'ANILLA_ROTA' ? (
                    <span className="text-[6px] text-rose-300 font-mono font-bold">SIN ANILLA</span>
                  ) : (
                    <div className="w-4 h-1.5 bg-slate-200 rounded border border-slate-500" />
                  )}
                </div>

                {/* Cuerpo metálico cilíndrico */}
                <div className={`w-18 h-24 border-2 border-slate-400 rounded-b-md relative overflow-hidden bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 flex flex-col justify-center items-center ${
                  envaseActual.subDefectoTipo === 'ABOMBAMIENTO' ? 'scale-x-115 rounded-xl border-rose-400' : ''
                }`}>
                  
                  {/* Abolladura */}
                  {envaseActual.subDefectoTipo === 'ABOLLADURA' && (
                    <div className="absolute -left-1 top-6 w-4 h-8 bg-slate-800/80 rounded-r-full border border-rose-500" />
                  )}

                  {/* Óxido */}
                  {envaseActual.subDefectoTipo === 'OXIDO' && (
                    <div className="absolute inset-2 bg-amber-800/60 rounded-sm border border-amber-500 flex items-center justify-center">
                      <span className="text-[7px] font-mono text-amber-200 font-bold">CORROSIÓN</span>
                    </div>
                  )}

                  {/* Etiqueta lata */}
                  <div className="w-14 h-8 bg-indigo-900/90 border border-indigo-400 rounded flex items-center justify-center text-[8px] font-bold text-white shadow">
                    CONSERVA
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Información del Estado del Envase */}
          <p className="text-xs font-mono text-slate-300 font-semibold tracking-wider uppercase">
            {loteActivo 
              ? `Envase en Posicionador (${tipoEnvase})` 
              : 'Detenido — Sin lote activo'}
          </p>

          {/* Resultado de la inspección actual */}
          <div className="mt-2 inline-flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900 border border-slate-700">
            <span className="text-slate-400">Inspección:</span>
            <span className={envaseActual.estado === 'CONFORME' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {envaseActual.estado === 'CONFORME' ? 'APROBADO' : 'RECHAZADO'}
            </span>
            {envaseActual.defecto && (
              <span className="text-rose-300 text-[11px]">
                ({envaseActual.defecto.nombre || envaseActual.defecto.codigo})
              </span>
            )}
          </div>

        </div>

        {/* Overlay de Parada de Emergencia */}
        {paradaEmergencia && (
          <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-center text-center animate-in fade-in">
            <div className="p-3 bg-rose-600 text-white rounded-2xl animate-bounce mb-3 shadow-glow-rose">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <h2 className="text-lg font-black text-rose-200 font-mono tracking-wider uppercase">
              🚨 PARADA DE EMERGENCIA EN LÍNEA
            </h2>
            
            <p className="text-xs font-mono text-rose-300 max-w-md mt-1 mb-4 bg-rose-900/50 p-2.5 rounded-xl border border-rose-700">
              {paradaEmergencia.motivo}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {!notificacionSupervisorEnviada ? (
                <button
                  onClick={handleNotificarSupervisor}
                  disabled={notificandoSupervisor}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Bell className="w-4 h-4 text-slate-950" />
                  <span>
                    {notificandoSupervisor ? 'Enviando Alerta Crítica...' : '📢 NOTIFICAR AL SUPERVISOR'}
                  </span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Alerta crítica remitida a Supervisión. Esperando atención...</span>
                </div>
              )}

              <button
                onClick={reactivarLinea}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center space-x-2 border border-slate-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Despejar y Reactivar Línea</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Controles de Simulación de Planta (Tanda Automática + Disparo) */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
        
        {!loteActivo ? (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Línea sin lote en proceso:</strong> No se pueden simular envases hasta que el Supervisor abra un lote para la línea {tipoEnvase}.
            </span>
          </div>
        ) : (
          <>
            {/* Panel de Ingestión Automática y Tanda */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-bold uppercase">Control de Tanda Automática:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Selector de Tamaño de Tanda */}
                <span className="text-slate-400 text-[11px]">Tamaño:</span>
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setTandaTamano(num)}
                    disabled={tandaActiva}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      tandaTamano === num
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num}u
                  </button>
                ))}

                {/* Cadencia en Segundos */}
                <span className="text-slate-400 text-[11px] ml-2">Cadencia:</span>
                {[
                  { label: '1s (Rápida)', val: 1 },
                  { label: '1.8s (Normal)', val: 1.8 },
                  { label: '3s (Lenta)', val: 3 },
                ].map((c) => (
                  <button
                    key={c.val}
                    onClick={() => setCadenciaSegundos(c.val)}
                    disabled={tandaActiva}
                    className={`px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                      cadenciaSegundos === c.val
                        ? 'bg-indigo-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Botones de Control de Tanda */}
              <div className="flex items-center space-x-2">
                {!tandaActiva ? (
                  <button
                    onClick={iniciarTanda}
                    disabled={procesando || paradaEmergencia}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-glow-cyan transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>INICIAR TANDA ({tandaTamano}u)</span>
                  </button>
                ) : (
                  <button
                    onClick={detenerTanda}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-glow-rose transition-all cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>DETENER TANDA ({tandaProgreso}/{tandaTamano})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fila de Disparo Manual y Pruebas Docentes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Botón: Disparo Manual Aleatorio */}
              <button
                onClick={ejecutarPasoSimulacion}
                disabled={procesando || tandaActiva || paradaEmergencia}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold border border-slate-700 hover:border-cyan-500/50 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Simular 1 Envase (Aleatorio)</span>
              </button>

              {/* Botón Docente: Provocar Atascamiento */}
              <button
                onClick={simularAtascamientoMecanico}
                disabled={procesando || tandaActiva || paradaEmergencia}
                className="py-3 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-mono text-xs font-bold border border-amber-600/40 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Simular Atascamiento</span>
              </button>

              {/* Botón Docente: Provocar 3 Fallas Consecutivas */}
              <button
                onClick={simularTresFallasDocente}
                disabled={procesando || tandaActiva || paradaEmergencia}
                className="py-3 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-xs font-bold border border-rose-600/40 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Simular 3 Fallas Consecutivas</span>
              </button>

            </div>

            {/* Aviso de Actuador en Línea */}
            {mensajeRechazo && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-mono flex items-center space-x-2 animate-in fade-in">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{mensajeRechazo}</span>
              </div>
            )}

          </>
        )}

      </div>

    </div>
  );
};

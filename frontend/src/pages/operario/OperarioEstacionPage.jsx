import React, { useState, useEffect, useCallback } from 'react';
import { lotesService, inspeccionesService, tiposDefectoService } from '../../services/api';
import { CamaraSimulator } from '../../components/operario/CamaraSimulator';
import { DefectoModal } from '../../components/operario/DefectoModal';
import { ContadorDescartes } from '../../components/operario/ContadorDescartes';
import { TablaAuditoria } from '../../components/supervisor/TablaAuditoria';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Factory, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  SlidersHorizontal,
  StopCircle,
  FileCheck,
  Clock,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export const OperarioEstacionPage = () => {
  const [tipoEnvase, setTipoEnvase] = useState('FRASCO'); // 'FRASCO' o 'LATA'
  const [loteActivo, setLoteActivo] = useState(null);
  const [todosLotes, setTodosLotes] = useState([]);
  const [todasInspecciones, setTodasInspecciones] = useState([]);
  const [defectosDisponibles, setDefectosDisponibles] = useState([]);
  
  const [resumenLote, setResumenLote] = useState({
    total_unidades: 0,
    unidades_aprobadas: 0,
    unidades_rechazadas: 0,
    tasa_defecto_porcentaje: 0,
  });
  const [recientes, setRecientes] = useState([]);
  const [ultimaInspeccion, setUltimaInspeccion] = useState(null);

  const [loadingLote, setLoadingLote] = useState(true);
  const [procesandoInspeccion, setProcesandoInspeccion] = useState(false);
  const [modalDefectoAbierto, setModalDefectoAbierto] = useState(false);
  const [modalCerrarLoteAbierto, setModalCerrarLoteAbierto] = useState(false);
  const [cerrandoLote, setCerrandoLote] = useState(false);
  const [mensajeToast, setMensajeToast] = useState(null);

  // Mostrar notificación temporal en la interfaz
  const mostrarToast = (texto, tipo = 'success') => {
    setMensajeToast({ texto, tipo });
    setTimeout(() => setMensajeToast(null), 3500);
  };

  // Cargar catálogo de defectos para el envase seleccionado
  const cargarDefectos = useCallback(async () => {
    try {
      const res = await tiposDefectoService.listar(tipoEnvase);
      if (res && res.success) {
        setDefectosDisponibles(res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar tipos de defecto:', err);
    }
  }, [tipoEnvase]);

  // Consulta en vivo del lote activo para la línea seleccionada y datos de auditoría
  const cargarLoteActivo = useCallback(async () => {
    setLoadingLote(true);
    try {
      const [resLote, resTodosLotes, resInspecciones] = await Promise.all([
        lotesService.getActivo(tipoEnvase),
        lotesService.listar(),
        inspeccionesService.listar({ limit: 100 })
      ]);

      if (resTodosLotes && resTodosLotes.success) {
        setTodosLotes(resTodosLotes.data || []);
      }

      if (resInspecciones && resInspecciones.success) {
        setTodasInspecciones(resInspecciones.inspecciones || resInspecciones.data || []);
      }

      if (resLote && resLote.success && resLote.data) {
        setLoteActivo(resLote.data);
        await cargarMetricasLote(resLote.data.id);
      } else {
        setLoteActivo(null);
        setResumenLote({
          total_unidades: 0,
          unidades_aprobadas: 0,
          unidades_rechazadas: 0,
          tasa_defecto_porcentaje: 0,
        });
        setRecientes([]);
      }
    } catch (err) {
      console.error('Error al consultar lote activo:', err);
      setLoteActivo(null);
    } finally {
      setLoadingLote(false);
    }
  }, [tipoEnvase]);

  // Consulta en vivo de los indicadores y descartes del lote
  const cargarMetricasLote = async (loteId) => {
    try {
      const response = await inspeccionesService.historialPorLote(loteId, { limit: 15 });
      if (response && response.success && response.data) {
        setResumenLote(response.data.resumen_estadistico);
        setRecientes(response.data.inspecciones || []);
        if (response.data.inspecciones && response.data.inspecciones.length > 0) {
          setUltimaInspeccion(response.data.inspecciones[0]);
        }
      }
    } catch (err) {
      console.error('Error al cargar métricas del lote:', err);
    }
  };

  useEffect(() => {
    cargarLoteActivo();
    cargarDefectos();
  }, [cargarLoteActivo, cargarDefectos]);

  // Polling automático mientras el lote esté DETENIDO para reactivación por el Supervisor
  useEffect(() => {
    if (!loteActivo || loteActivo.estado !== 'DETENIDO') return;

    const interval = setInterval(async () => {
      try {
        const res = await lotesService.getActivo(tipoEnvase);
        if (res && res.success && res.data && res.data.estado === 'EN_PROCESO') {
          setLoteActivo(res.data);
          mostrarToast('✅ El Supervisor atendió la parada y autorizó la reanudación de la línea', 'success');
          await cargarLoteActivo();
        }
      } catch (e) {
        console.error('Error al sondear reactivación de línea:', e);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [loteActivo, tipoEnvase, cargarLoteActivo]);

  // Simulación: Pieza Conforme (APROBADO)
  const handlePiezaConforme = async () => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') return;
    setProcesandoInspeccion(true);

    try {
      const payload = {
        lote_id: loteActivo.id,
        estado: 'APROBADO',
        observacion: 'Pieza conforme verificada por sensor AVZ-02',
      };

      const response = await inspeccionesService.registrar(payload);
      if (response && response.success) {
        setUltimaInspeccion(response.data);
        mostrarToast('✅ Pieza aprobada y registrada en Neon Cloud');
        await cargarMetricasLote(loteActivo.id);
      }
    } catch (err) {
      mostrarToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setProcesandoInspeccion(false);
    }
  };

  // Simulación: Detección Automática de Defecto (con actuador de rechazo)
  const handleDefectoDetectadoAutomatico = async ({ tipo_defecto_id, observacion, imagen_url }) => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') return;
    setProcesandoInspeccion(true);

    try {
      const payload = {
        lote_id: loteActivo.id,
        tipo_defecto_id,
        estado: 'RECHAZADO',
        observacion: observacion || 'Rechazo automático por sensor AVZ-02',
        imagen_url,
      };

      const response = await inspeccionesService.registrar(payload);
      if (response && response.success) {
        setUltimaInspeccion(response.data);
        mostrarToast('🚨 Falla registrada: Alerta operativa enviada a Supervisión', 'warning');
        await cargarMetricasLote(loteActivo.id);
      }
    } catch (err) {
      mostrarToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setProcesandoInspeccion(false);
    }
  };

  // Simulación: Confirmación manual de Defecto desde el modal táctil
  const handleConfirmarRechazo = async ({ tipo_defecto_id, observacion, imagen_url }) => {
    if (!loteActivo || loteActivo.estado !== 'EN_PROCESO') return;

    await handleDefectoDetectadoAutomatico({
      tipo_defecto_id,
      observacion: observacion || 'Falla registrada manualmente por operario',
      imagen_url
    });
  };

  // Notificar al Supervisor ante Parada de Emergencia y Detener Línea
  const handleNotificarParadaEmergencia = async ({ motivo, tipo, envase }) => {
    if (!loteActivo) return;

    try {
      // 1. Detener formalmente el lote en el backend (crea alerta crítica y cambia estado a DETENIDO)
      const res = await lotesService.detener(loteActivo.id, motivo || `Parada de emergencia por ${tipo}`);
      if (res && res.success) {
        mostrarToast('🚨 Parada de emergencia notificada: Línea bloqueada en espera del Supervisor', 'error');
        await cargarLoteActivo();
      }
    } catch (err) {
      mostrarToast(`Error al notificar parada: ${err.message}`, 'error');
    }
  };

  // Acción: Operario cierra el lote (solicita visto bueno del supervisor)
  const handleSolicitarCierreLote = async () => {
    if (!loteActivo) return;
    setCerrandoLote(true);
    try {
      const response = await lotesService.cerrar(loteActivo.id);
      if (response && response.success) {
        mostrarToast('✅ Lote cerrado por Operario. En espera de visto bueno del Supervisor.');
        setModalCerrarLoteAbierto(false);
        await cargarLoteActivo();
      }
    } catch (err) {
      mostrarToast(`Error al solicitar cierre: ${err.message}`, 'error');
    } finally {
      setCerrandoLote(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast Notificación */}
      {mensajeToast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl border shadow-2xl font-mono text-xs flex items-center space-x-2 animate-in slide-in-from-top-2 ${
          mensajeToast.tipo === 'success'
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
            : mensajeToast.tipo === 'warning'
            ? 'bg-amber-950/90 border-amber-500 text-amber-300'
            : 'bg-rose-950/90 border-rose-500 text-rose-300'
        }`}>
          <span>{mensajeToast.texto}</span>
        </div>
      )}

      {/* Selector de Línea de Producción y Estado del Lote */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Selector Táctil de Línea */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              ESTACIÓN DE CONTROL DE LÍNEA — KIT AVZ-02
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Simulador de Visión Artificial • Detección y Rechazo en Tiempo Real
            </p>
          </div>
        </div>

        {/* Botones de Selección de Envase */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 mr-2 hidden sm:inline">
            Línea Activa:
          </span>

          <button
            onClick={() => setTipoEnvase('FRASCO')}
            className={`btn-tactile px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              tipoEnvase === 'FRASCO'
                ? 'bg-cyan-500 text-slate-950 border-2 border-cyan-300 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            FRASCO DE VIDRIO
          </button>

          <button
            onClick={() => setTipoEnvase('LATA')}
            className={`btn-tactile px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              tipoEnvase === 'LATA'
                ? 'bg-indigo-500 text-white border-2 border-indigo-300 shadow-lg'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            LATA METÁLICA
          </button>

          <button
            onClick={cargarLoteActivo}
            title="Refrescar Lote"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLote ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

      </div>

      {/* Banner de Lote Activo / En Cierre */}
      {loadingLote ? (
        <LoadingSpinner text="Sincronizando lote en proceso..." />
      ) : loteActivo ? (
        <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-colors ${
          loteActivo.estado === 'DETENIDO'
            ? 'bg-rose-950/20 border-rose-500/40'
            : loteActivo.estado === 'PENDIENTE_CIERRE'
            ? 'bg-amber-950/20 border-amber-500/40'
            : 'bg-slate-900/60 border-cyan-500/20'
        }`}>
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Lote en Inspección</span>
              <span className="text-sm font-bold font-mono text-cyan-400">{loteActivo.codigo_lote}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Producto</span>
              <span className="text-sm font-medium text-slate-200">{loteActivo.producto}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <StatusBadge type="estado" value={loteActivo.estado} />
            <span className="text-xs font-mono text-slate-400">
              Línea: <strong className="text-slate-200">{loteActivo.tipo_envase}</strong>
            </span>

            {/* Acciones de Lote para Operario */}
            {loteActivo.estado === 'EN_PROCESO' ? (
              <button
                onClick={() => setModalCerrarLoteAbierto(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-mono font-bold transition-all shadow cursor-pointer ml-2"
              >
                <StopCircle className="w-4 h-4" />
                <span>CERRAR LOTE (FIN DE TURNO)</span>
              </button>
            ) : loteActivo.estado === 'DETENIDO' ? (
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 ml-2 animate-pulse">
                <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>LÍNEA DETENIDA — Esperando reanudación del Supervisor</span>
              </span>
            ) : loteActivo.estado === 'PENDIENTE_CIERRE' ? (
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-mono flex items-center space-x-1.5 ml-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Cierre solicitado — Esperando visto bueno del Supervisor</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center space-x-3 text-amber-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            No hay ningún lote <strong>EN PROCESO</strong> para la línea de {tipoEnvase}. Solicite al Supervisor la apertura de un nuevo lote.
          </span>
        </div>
      )}

      {/* Panel Principal Dividido: Visor de Cámara + Tarjetas de Contadores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Visor del KIT AVZ-02 y Simulador Táctil (7 cols) */}
        <div className="lg:col-span-7">
          <CamaraSimulator
            tipoEnvase={tipoEnvase}
            loteActivo={loteActivo}
            onPiezaConforme={handlePiezaConforme}
            onRegistrarDefecto={() => setModalDefectoAbierto(true)}
            onDefectoDetectadoAutomatico={handleDefectoDetectadoAutomatico}
            onNotificarParadaEmergencia={handleNotificarParadaEmergencia}
            procesando={procesandoInspeccion}
            ultimaInspeccion={ultimaInspeccion}
            defectosDisponibles={defectosDisponibles}
          />
        </div>

        {/* Columna Derecha: Tarjetas de Recuento de Descartes y Métricas (5 cols) */}
        <div className="lg:col-span-5">
          <ContadorDescartes
            resumen={resumenLote}
            recientes={recientes}
          />
        </div>

      </div>

      {/* Registro y Auditoría Agrupada por Lote para Operario (Read-Only de Alertas) */}
      <div className="pt-2">
        <TablaAuditoria
          inspecciones={todasInspecciones}
          lotes={todosLotes}
          onRefrescar={cargarLoteActivo}
          cargando={loadingLote}
          userRole="OPERARIO"
        />
      </div>

      {/* Modal Emergente para Registro Manual de Falla */}
      <DefectoModal
        isOpen={modalDefectoAbierto}
        onClose={() => setModalDefectoAbierto(false)}
        onConfirmarRechazo={handleConfirmarRechazo}
        tipoEnvase={tipoEnvase}
        lote={loteActivo}
      />

      {/* Modal de Cierre de Lote para el Operario */}
      {modalCerrarLoteAbierto && loteActivo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-400">
              <StopCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white font-mono uppercase">
                Cerrar Lote de Producción
              </h3>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              ¿Desea solicitar el cierre del lote <strong className="text-cyan-400">{loteActivo.codigo_lote}</strong> ({tipoEnvase})?
            </p>

            {/* Resumen de Producción */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Total Unidades:</span>
                <span className="text-white font-bold">{resumenLote.total_unidades}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Aprobados:</span>
                <span className="font-bold">{resumenLote.unidades_aprobadas}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Rechazados:</span>
                <span className="font-bold">{resumenLote.unidades_rechazadas}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Tasa de Falla:</span>
                <span className="font-bold">{resumenLote.tasa_defecto_porcentaje}%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              ℹ️ Al cerrar el lote, la línea finalizará las capturas y se notificará al <strong>Supervisor de Calidad</strong> para que revise los resultados y emita el visto bueno final.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setModalCerrarLoteAbierto(false)}
                disabled={cerrandoLote}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarCierreLote}
                disabled={cerrandoLote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-glow-rose cursor-pointer flex items-center space-x-2"
              >
                {cerrandoLote ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4" />
                )}
                <span>Confirmar y Solicitar Cierre</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

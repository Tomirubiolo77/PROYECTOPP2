import React, { useState, useEffect, useCallback } from 'react';
import { lotesService, inspeccionesService } from '../../services/api';
import { CamaraSimulator } from '../../components/operario/CamaraSimulator';
import { DefectoModal } from '../../components/operario/DefectoModal';
import { ContadorDescartes } from '../../components/operario/ContadorDescartes';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Factory, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  SlidersHorizontal 
} from 'lucide-react';

export const OperarioEstacionPage = () => {
  const [tipoEnvase, setTipoEnvase] = useState('FRASCO'); // 'FRASCO' o 'LATA'
  const [loteActivo, setLoteActivo] = useState(null);
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
  const [mensajeToast, setMensajeToast] = useState(null);

  // Consulta en vivo del lote activo para la línea seleccionada
  const cargarLoteActivo = useCallback(async () => {
    setLoadingLote(true);
    try {
      const response = await lotesService.getActivo(tipoEnvase);
      if (response && response.success && response.data) {
        setLoteActivo(response.data);
        await cargarMetricasLote(response.data.id);
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
      const response = await inspeccionesService.historialPorLote(loteId, { limit: 10 });
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
  }, [cargarLoteActivo]);

  // Mostrar notificación temporal en la interfaz
  const mostrarToast = (texto, tipo = 'success') => {
    setMensajeToast({ texto, tipo });
    setTimeout(() => setMensajeToast(null), 3500);
  };

  // Simulación: Pieza Conforme (APROBADO)
  const handlePiezaConforme = async () => {
    if (!loteActivo) return;
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

  // Simulación: Confirmación de Pieza Defectuosa (RECHAZADO)
  const handleConfirmarRechazo = async ({ tipo_defecto_id, observacion, imagen_url }) => {
    if (!loteActivo) return;

    const payload = {
      lote_id: loteActivo.id,
      tipo_defecto_id,
      estado: 'RECHAZADO',
      observacion,
      imagen_url,
    };

    const response = await inspeccionesService.registrar(payload);
    if (response && response.success) {
      setUltimaInspeccion(response.data);
      mostrarToast('🚨 Falla registrada: Alerta operativa enviada a Supervisión', 'warning');
      await cargarMetricasLote(loteActivo.id);
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
              ESTACIÓN DE CONTROL DE LÍNEA
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Sensor Óptico AVZ-02 • Inspección en Tiempo Real
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

      {/* Banner de Lote Activo */}
      {loadingLote ? (
        <LoadingSpinner text="Sincronizando lote en proceso..." />
      ) : loteActivo ? (
        <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
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
        
        {/* Columna Izquierda: Visor y Simulador Táctil (7 cols) */}
        <div className="lg:col-span-7">
          <CamaraSimulator
            tipoEnvase={tipoEnvase}
            loteActivo={loteActivo}
            onPiezaConforme={handlePiezaConforme}
            onRegistrarDefecto={() => setModalDefectoAbierto(true)}
            procesando={procesandoInspeccion}
            ultimaInspeccion={ultimaInspeccion}
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

      {/* Modal Emergente para Registro de Falla */}
      <DefectoModal
        isOpen={modalDefectoAbierto}
        onClose={() => setModalDefectoAbierto(false)}
        onConfirmarRechazo={handleConfirmarRechazo}
        tipoEnvase={tipoEnvase}
        lote={loteActivo}
      />

    </div>
  );
};

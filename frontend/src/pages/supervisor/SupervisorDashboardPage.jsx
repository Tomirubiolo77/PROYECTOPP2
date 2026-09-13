import React, { useState, useEffect, useCallback } from 'react';
import { 
  lotesService, 
  alertasService, 
  inspeccionesService 
} from '../../services/api';
import { LoteControlCard } from '../../components/supervisor/LoteControlCard';
import { NuevoLoteModal } from '../../components/supervisor/NuevoLoteModal';
import { BandejaAlertas } from '../../components/supervisor/BandejaAlertas';
import { TablaAuditoria } from '../../components/supervisor/TablaAuditoria';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  Layers, 
  RefreshCw,
  Bell
} from 'lucide-react';

export const SupervisorDashboardPage = () => {
  const [loteActivo, setLoteActivo] = useState(null);
  const [todosLotes, setTodosLotes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [metricasAlertas, setMetricasAlertas] = useState({
    total: 0,
    pendientes: 0,
    atendidas: 0,
    criticas: 0,
    criticas_pendientes: 0,
  });
  const [inspecciones, setInspecciones] = useState([]);
  
  // Filtros de Auditoría
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [loading, setLoading] = useState(true);
  const [procesandoLote, setProcesandoLote] = useState(false);
  const [modalNuevoLoteAbierto, setModalNuevoLoteAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = (texto, tipo = 'success') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 3500);
  };

  // Carga general de datos para el dashboard
  const cargarDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [resLoteActivo, resTodosLotes, resAlertas, resMetricas, resInspecciones] = await Promise.all([
        lotesService.getActivo(),
        lotesService.listar(),
        alertasService.listar({ limit: 50 }),
        alertasService.metricas(),
        inspeccionesService.listar({
          lote_id: filtroLote || undefined,
          estado: filtroEstado || undefined,
          limit: 50,
        }),
      ]);

      if (resLoteActivo && resLoteActivo.success) {
        setLoteActivo(resLoteActivo.data);
      } else {
        setLoteActivo(null);
      }

      if (resTodosLotes && resTodosLotes.success) {
        setTodosLotes(resTodosLotes.data || []);
      }

      if (resAlertas && resAlertas.success) {
        setAlertas(resAlertas.alertas || resAlertas.data || []);
      }

      if (resMetricas && resMetricas.success) {
        const m = resMetricas.data || {};
        setMetricasAlertas({
          total: m.total_alertas ?? m.total ?? 0,
          pendientes: m.alertas_pendientes ?? m.pendientes ?? 0,
          criticas_pendientes: m.alertas_criticas_pendientes ?? m.criticas_pendientes ?? 0,
          atendidas: m.alertas_resueltas ?? m.atendidas ?? 0,
        });
      }

      if (resInspecciones && resInspecciones.success) {
        setInspecciones(resInspecciones.inspecciones || resInspecciones.data || []);
      }
    } catch (err) {
      console.error('Error al cargar datos de supervisión:', err);
      mostrarNotificacion(`Error al cargar datos: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroLote, filtroEstado]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  // Acción: Finalizar Lote / Turno
  const handleFinalizarLote = async (id) => {
    setProcesandoLote(true);
    try {
      const res = await lotesService.finalizar(id);
      if (res && res.success) {
        mostrarNotificacion(`Lote finalizado correctamente: ${res.message}`);
        await cargarDashboard();
      }
    } catch (err) {
      mostrarNotificacion(`Error al finalizar lote: ${err.message}`, 'error');
    } finally {
      setProcesandoLote(false);
    }
  };

  // Acción: Aperturar Nuevo Lote
  const handleCrearLote = async (datos) => {
    setProcesandoLote(true);
    try {
      const res = await lotesService.crear(datos);
      if (res && res.success) {
        mostrarNotificacion(`Nuevo lote ${datos.codigo_lote} creado y activo.`);
        await cargarDashboard();
      }
    } catch (err) {
      throw err;
    } finally {
      setProcesandoLote(false);
    }
  };

  // Acción: Atender Alerta
  const handleAtenderAlerta = async (id) => {
    try {
      const res = await alertasService.atender(id);
      if (res && res.success) {
        mostrarNotificacion(`Alerta #${id} atendida exitosamente.`);
        // Refrescar alertas y métricas
        const [resAlertas, resMetricas] = await Promise.all([
          alertasService.listar({ limit: 50 }),
          alertasService.metricas(),
        ]);
        if (resAlertas?.success) setAlertas(resAlertas.alertas || resAlertas.data || []);
        if (resMetricas?.success) {
          const m = resMetricas.data || {};
          setMetricasAlertas({
            total: m.total_alertas ?? m.total ?? 0,
            pendientes: m.alertas_pendientes ?? m.pendientes ?? 0,
            criticas_pendientes: m.alertas_criticas_pendientes ?? m.criticas_pendientes ?? 0,
            atendidas: m.alertas_resueltas ?? m.atendidas ?? 0,
          });
        }
      }
    } catch (err) {
      mostrarNotificacion(`Error al atender alerta: ${err.message}`, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Notificación Flotante */}
      {notificacion && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl border shadow-2xl font-mono text-xs flex items-center space-x-2 animate-in slide-in-from-top-2 ${
          notificacion.tipo === 'success'
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
            : 'bg-rose-950/90 border-rose-500 text-rose-300'
        }`}>
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide uppercase font-mono">
            PANEL DE SUPERVISIÓN Y CONTROL DE CALIDAD
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            KIT AVZ-02 • Monitoreo de Planta, Auditoría y Alertas en Vivo
          </p>
        </div>

        <button
          onClick={cargarDashboard}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-mono font-medium border border-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>ACTUALIZAR DATOS</span>
        </button>
      </div>

      {/* Tarjetas de Métricas y KPIs de Alertas en Vivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Alertas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Alertas</span>
            <Bell className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-white">
              {metricasAlertas.total || 0}
            </span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Eventos registrados</p>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pendientes</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-amber-400">
              {metricasAlertas.pendientes || 0}
            </span>
            <p className="text-[10px] text-amber-500/80 font-mono mt-0.5">Requieren intervención</p>
          </div>
        </div>

        {/* Críticas Pendientes */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Críticas Pendientes</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-rose-400">
              {metricasAlertas.criticas_pendientes || 0}
            </span>
            <p className="text-[10px] text-rose-500/80 font-mono mt-0.5">Parada o riesgo severo</p>
          </div>
        </div>

        {/* Atendidas / Resueltas */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Atendidas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {metricasAlertas.atendidas || 0}
            </span>
            <p className="text-[10px] text-emerald-500/80 font-mono mt-0.5">Desvíos subsanados</p>
          </div>
        </div>

      </div>

      {/* Control de Lote Activo */}
      <LoteControlCard
        lote={loteActivo}
        onFinalizarLote={handleFinalizarLote}
        onAbrirModalNuevoLote={() => setModalNuevoLoteAbierto(true)}
        procesando={procesandoLote}
      />

      {/* Bandeja de Alertas Operativas */}
      <BandejaAlertas
        alertas={alertas}
        onAtenderAlerta={handleAtenderAlerta}
        onRefrescar={cargarDashboard}
        cargando={loading}
      />

      {/* Registro y Auditoría Histórica con Filtros */}
      <TablaAuditoria
        inspecciones={inspecciones}
        lotes={todosLotes}
        filtroLote={filtroLote}
        filtroEstado={filtroEstado}
        onCambiarFiltroLote={setFiltroLote}
        onCambiarFiltroEstado={setFiltroEstado}
        onRefrescar={cargarDashboard}
        cargando={loading}
      />

      {/* Modal de Apertura de Lote */}
      <NuevoLoteModal
        isOpen={modalNuevoLoteAbierto}
        onClose={() => setModalNuevoLoteAbierto(false)}
        onCrearLote={handleCrearLote}
        procesando={procesandoLote}
      />

    </div>
  );
};

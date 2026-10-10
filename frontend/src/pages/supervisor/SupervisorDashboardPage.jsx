import React, { useState, useEffect, useCallback } from 'react';
import { 
  lotesService, 
  alertasService, 
  inspeccionesService,
  dashboardService
} from '../../services/api';
import { LoteControlCard } from '../../components/supervisor/LoteControlCard';
import { NuevoLoteModal } from '../../components/supervisor/NuevoLoteModal';
import { BandejaAlertas } from '../../components/supervisor/BandejaAlertas';
import { TablaAuditoria } from '../../components/supervisor/TablaAuditoria';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// Componentes Analíticos de la Semana 08
import { KpiCardsSection } from '../../components/dashboard/KpiCardsSection';
import { ParetoChart } from '../../components/dashboard/ParetoChart';
import { ProporcionDonutChart } from '../../components/dashboard/ProporcionDonutChart';
import { EvolucionTemporalChart } from '../../components/dashboard/EvolucionTemporalChart';
import { ComparativaEnvaseChart } from '../../components/dashboard/ComparativaEnvaseChart';
import { FiltrosAuditoriaBar } from '../../components/dashboard/FiltrosAuditoriaBar';

import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  Layers, 
  RefreshCw,
  Bell,
  Activity,
  Factory,
  StopCircle,
  SlidersHorizontal
} from 'lucide-react';

export const SupervisorDashboardPage = () => {
  // Pestaña activa: 'OPERACION' o 'ANALITICA'
  const [tabActiva, setTabActiva] = useState('ANALITICA');

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

  // Métricas y Gráficos del Módulo Analítico (Semana 08)
  const [kpis, setKpis] = useState({
    total_procesado: 0,
    aprobados: 0,
    rechazados: 0,
    tasa_descarte: 0,
    tasa_aprobacion: 0,
    tiempo_promedio_seg: 1.8,
  });
  const [graficos, setGraficos] = useState({
    pareto_defectos: [],
    evolucion_temporal: [],
    comparativa_envase: [],
  });

  // Filtros Multidimensionales de Auditoría
  const [filtrosAnalitica, setFiltrosAnalitica] = useState({
    lote_id: '',
    tipo_envase: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  // Filtros de Auditoría para la tabla tradicional
  const [filtroLote, setFiltroLote] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingAnalitica, setLoadingAnalitica] = useState(false);
  const [procesandoLote, setProcesandoLote] = useState(false);
  const [modalNuevoLoteAbierto, setModalNuevoLoteAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = (texto, tipo = 'success') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 3500);
  };

  // Carga analítica reactiva (KPIs y Gráficos Chart.js)
  const cargarAnalitica = useCallback(async (filtrosActuales) => {
    setLoadingAnalitica(true);
    try {
      const [resKpis, resGraficos] = await Promise.all([
        dashboardService.kpis(filtrosActuales),
        dashboardService.graficos(filtrosActuales),
      ]);

      if (resKpis && resKpis.success) {
        setKpis(resKpis.data || {});
      }
      if (resGraficos && resGraficos.success) {
        setGraficos(resGraficos.data || {});
      }
    } catch (err) {
      console.error('Error al cargar métricas analíticas:', err);
    } finally {
      setLoadingAnalitica(false);
    }
  }, []);

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

      // Cargar analítica también
      await cargarAnalitica(filtrosAnalitica);
    } catch (err) {
      console.error('Error al cargar datos de supervisión:', err);
      mostrarNotificacion(`Error al cargar datos: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroLote, filtroEstado, filtrosAnalitica, cargarAnalitica]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  // Manejo de cambio de filtros analíticos
  const handleCambiarFiltroAnalitica = (clave, valor) => {
    const nuevos = { ...filtrosAnalitica, [clave]: valor };
    setFiltrosAnalitica(nuevos);
    cargarAnalitica(nuevos);
  };

  const handleLimpiarFiltrosAnalitica = () => {
    const vacios = { lote_id: '', tipo_envase: '', fecha_desde: '', fecha_hasta: '' };
    setFiltrosAnalitica(vacios);
    cargarAnalitica(vacios);
  };

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

  // Acción: Reanudar Línea Detenida (Supervisor Levanta Parada de Emergencia)
  const handleReanudarLote = async (id) => {
    setProcesandoLote(true);
    try {
      const res = await lotesService.reanudar(id);
      if (res && res.success) {
        mostrarNotificacion(`✅ Línea reanudada: ${res.message}`, 'success');
        await cargarDashboard();
      }
    } catch (err) {
      mostrarNotificacion(`Error al reanudar línea: ${err.message}`, 'error');
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
        await cargarDashboard();
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
            KIT AVZ-02 • Inteligencia Operativa, KPIs, Gráficos Analíticos y Control de Planta
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Selector de Pestaña Principal */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setTabActiva('ANALITICA')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tabActiva === 'ANALITICA'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>INTELIGENCIA & KPIS</span>
            </button>
            <button
              onClick={() => setTabActiva('OPERACION')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tabActiva === 'OPERACION'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>PLANTA & ALERTAS</span>
            </button>
          </div>

          <button
            onClick={cargarDashboard}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-mono font-medium border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">ACTUALIZAR</span>
          </button>
        </div>
      </div>

      {/* BANNER DE ALERTA CRÍTICA: Parada de Línea Activa */}
      {loteActivo?.estado === 'DETENIDO' && (
        <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-600 text-white rounded-2xl animate-pulse shadow-glow-rose">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-rose-300 uppercase tracking-wider bg-rose-900/60 border border-rose-700 px-2.5 py-0.5 rounded-full">
                  🚨 PARADA DE EMERGENCIA EN LÍNEA
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  Lote: {loteActivo.codigo_lote} ({loteActivo.tipo_envase})
                </span>
              </div>
              <h3 className="text-base font-black text-white font-mono mt-1">
                La línea de producción se encuentra DETENIDA por incidencia crítica
              </h3>
              <p className="text-xs text-rose-200 font-mono mt-0.5">
                El sensor AVZ-02 bloqueó el avance por desvío severo o reporte manual del operario. Verifique las condiciones y autorice la reanudación.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleReanudarLote(loteActivo.id)}
            disabled={procesandoLote}
            className="flex items-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl shadow-glow-emerald transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span>🛠️ ATENDER Y REANUDAR LÍNEA</span>
          </button>
        </div>
      )}

      {/* VISTA 1: MÓDULO DE INTELIGENCIA OPERATIVA, KPIS Y DASHBOARDS ANALÍTICOS (SEMANA 08) */}
      {tabActiva === 'ANALITICA' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Tarjetas de Métricas de Agregación (KPIs) */}
          <KpiCardsSection kpis={kpis} />

          {/* Barra de Filtros Multidimensionales */}
          <FiltrosAuditoriaBar
            lotes={todosLotes}
            filtros={filtrosAnalitica}
            onCambiarFiltro={handleCambiarFiltroAnalitica}
            onLimpiarFiltros={handleLimpiarFiltrosAnalitica}
            cargando={loadingAnalitica}
          />

          {/* Grilla Principal de Gráficos Chart.js */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gráfico 1: Diagrama de Pareto de Defectos (7 cols) */}
            <div className="lg:col-span-7">
              <ParetoChart data={graficos.pareto_defectos} />
            </div>

            {/* Gráfico 2: Proporción Aprobados vs. Rechazados (5 cols) */}
            <div className="lg:col-span-5">
              <ProporcionDonutChart
                aprobados={kpis.aprobados}
                rechazados={kpis.rechazados}
                tasaDescarte={kpis.tasa_descarte}
              />
            </div>

            {/* Gráfico 3: Evolución Temporal de Calidad (7 cols) */}
            <div className="lg:col-span-7">
              <EvolucionTemporalChart data={graficos.evolucion_temporal} />
            </div>

            {/* Gráfico 4: Comparativa por Tipo de Envase FRASCO vs LATA (5 cols) */}
            <div className="lg:col-span-5">
              <ComparativaEnvaseChart data={graficos.comparativa_envase} />
            </div>

          </div>

          {/* Tabla de Auditoría Histórica Filtrable */}
          <div className="pt-2">
            <TablaAuditoria
              inspecciones={inspecciones}
              lotes={todosLotes}
              filtroLote={filtroLote}
              filtroEstado={filtroEstado}
              onCambiarFiltroLote={setFiltroLote}
              onCambiarFiltroEstado={setFiltroEstado}
              onAtenderAlerta={handleAtenderAlerta}
              onRefrescar={cargarDashboard}
              cargando={loading}
              userRole="SUPERVISOR"
            />
          </div>

        </div>
      )}

      {/* VISTA 2: VISTA OPERATIVA Y DE PLANTA */}
      {tabActiva === 'OPERACION' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Tarjetas de Métricas de Alertas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
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
            onReanudarLote={handleReanudarLote}
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
            onAtenderAlerta={handleAtenderAlerta}
            onRefrescar={cargarDashboard}
            cargando={loading}
            userRole="SUPERVISOR"
          />

        </div>
      )}

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

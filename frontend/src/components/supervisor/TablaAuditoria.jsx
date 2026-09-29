import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { inspeccionesService } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  Package, 
  Clock, 
  Filter, 
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const TablaAuditoria = ({
  inspecciones = [],
  lotes = [],
  filtroLote = '',
  filtroEstado = '',
  onCambiarFiltroLote,
  onCambiarFiltroEstado,
  onAtenderAlerta,
  onRefrescar,
  cargando = false,
  userRole = null,
}) => {
  const { user } = useAuth();
  const rolEfectivo = userRole || user?.rol || 'OPERARIO';
  const esSupervisorOAdmin = rolEfectivo === 'SUPERVISOR' || rolEfectivo === 'ADMIN';

  // Lote expandido en la vista agrupada
  const [loteExpandidoId, setLoteExpandidoId] = useState(null);
  const [detalleLoteCargando, setDetalleLoteCargando] = useState(false);
  const [inspeccionesPorLoteMap, setInspeccionesPorLoteMap] = useState({});
  const [atendiendoAlertaId, setAtendiendoAlertaId] = useState(null);
  const [filtroTipoEnvase, setFiltroTipoEnvase] = useState('');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  // Expandir / colapsar lote y cargar sus inspecciones en vivo si no están en cache
  const toggleExpandirLote = async (loteId) => {
    if (loteExpandidoId === loteId) {
      setLoteExpandidoId(null);
      return;
    }

    setLoteExpandidoId(loteId);

    // Si ya tenemos inspecciones cargadas de este lote, no recargar
    if (inspeccionesPorLoteMap[loteId]) return;

    setDetalleLoteCargando(true);
    try {
      const res = await inspeccionesService.historialPorLote(loteId, { limit: 100 });
      if (res && res.success && res.data) {
        setInspeccionesPorLoteMap(prev => ({
          ...prev,
          [loteId]: {
            inspecciones: res.data.inspecciones || [],
            resumen: res.data.resumen_estadistico || {}
          }
        }));
      }
    } catch (err) {
      console.error(`Error al cargar inspecciones del lote #${loteId}:`, err);
    } finally {
      setDetalleLoteCargando(false);
    }
  };

  // Manejar acción de atender alerta
  const handleAtender = async (alertaId, loteId) => {
    if (!onAtenderAlerta || !esSupervisorOAdmin) return;
    setAtendiendoAlertaId(alertaId);
    try {
      await onAtenderAlerta(alertaId);

      // Actualizar localmente el estado de la alerta en el mapa del lote
      setInspeccionesPorLoteMap(prev => {
        const loteData = prev[loteId];
        if (!loteData) return prev;
        const actualizadas = loteData.inspecciones.map(insp => {
          if (!insp.alertas) return insp;
          return {
            ...insp,
            alertas: insp.alertas.map(a => a.id === alertaId ? { ...a, atendida: true } : a)
          };
        });
        return {
          ...prev,
          [loteId]: {
            ...loteData,
            inspecciones: actualizadas
          }
        };
      });
    } catch (err) {
      console.error('Error al atender alerta desde auditoría:', err);
    } finally {
      setAtendiendoAlertaId(null);
    }
  };

  // Filtrado de lotes para la tabla principal
  const lotesFiltrados = lotes.filter(lote => {
    if (filtroLote && lote.id !== parseInt(filtroLote, 10)) return false;
    if (filtroTipoEnvase && lote.tipo_envase !== filtroTipoEnvase) return false;
    if (filtroEstado && lote.estado !== filtroEstado) return false;
    if (busquedaTexto) {
      const q = busquedaTexto.toLowerCase();
      const matchCodigo = lote.codigo_lote?.toLowerCase().includes(q);
      const matchProd = lote.producto?.toLowerCase().includes(q);
      if (!matchCodigo && !matchProd) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Header y Filtros */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              REGISTRO Y AUDITORÍA DE INSPECCIONES
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Consolidado por Lote — Seleccione un lote para auditar aprobados, rechazos y alertas
            </p>
          </div>
        </div>

        {/* Controles de Filtro */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          
          {/* Búsqueda rápida */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar lote / producto..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Filtro Tipo Envase */}
          <select
            value={filtroTipoEnvase}
            onChange={(e) => setFiltroTipoEnvase(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">TODOS LOS ENVASES</option>
            <option value="FRASCO">FRASCO</option>
            <option value="LATA">LATA</option>
          </select>

          {/* Filtro Estado del Lote */}
          <select
            value={filtroEstado}
            onChange={(e) => {
              if (onCambiarFiltroEstado) onCambiarFiltroEstado(e.target.value);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">TODOS LOS ESTADOS</option>
            <option value="EN_PROCESO">EN PROCESO</option>
            <option value="PENDIENTE_CIERRE">PENDIENTE DE CIERRE</option>
            <option value="FINALIZADO">FINALIZADO</option>
          </select>

          <button
            onClick={onRefrescar}
            disabled={cargando}
            title="Refrescar auditoría"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista Agrupada de Lotes */}
      <div className="divide-y divide-slate-800">
        {lotesFiltrados.length === 0 ? (
          <EmptyState
            title="No hay lotes para mostrar"
            description="No se encontraron lotes de producción con los filtros seleccionados."
          />
        ) : (
          lotesFiltrados.map((lote) => {
            const isExpandido = loteExpandidoId === lote.id;
            
            // Inspecciones asociadas desde la lista global o desde el mapa específico
            const inspeccionesDelLote = inspeccionesPorLoteMap[lote.id]?.inspecciones ||
              inspecciones.filter(i => (i.lote_id === lote.id || i.lotes?.id === lote.id));

            const total = inspeccionesDelLote.length;
            const aprobados = inspeccionesDelLote.filter(i => i.estado === 'APROBADO').length;
            const rechazados = inspeccionesDelLote.filter(i => i.estado === 'RECHAZADO').length;
            
            // Conteo de alertas
            let alertasTotal = 0;
            let alertasPendientes = 0;
            let alertasAtendidas = 0;
            inspeccionesDelLote.forEach(i => {
              if (i.alertas && i.alertas.length > 0) {
                i.alertas.forEach(a => {
                  alertasTotal++;
                  if (a.atendida) alertasAtendidas++;
                  else alertasPendientes++;
                });
              }
            });

            return (
              <div key={lote.id} className="transition-colors">
                {/* Fila Principal de Lote (Clickable para expandir) */}
                <div 
                  onClick={() => toggleExpandirLote(lote.id)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors ${
                    isExpandido ? 'bg-slate-800/60 border-l-4 border-cyan-400' : ''
                  }`}
                >
                  {/* Info básica del Lote */}
                  <div className="flex items-center space-x-3.5">
                    <button className="text-cyan-400 p-1 rounded hover:bg-cyan-500/10">
                      {isExpandido ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-sm font-bold text-white hover:text-cyan-300">
                          {lote.codigo_lote}
                        </span>
                        <StatusBadge type="envase" value={lote.tipo_envase} />
                        <StatusBadge type="estado" value={lote.estado} />
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        {lote.producto}
                      </p>
                    </div>
                  </div>

                  {/* Badges de Conteo: Aprobados, Rechazados y Alertas */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{aprobados} Aprobados</span>
                    </span>

                    <span className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{rechazados} Rechazados</span>
                    </span>

                    {alertasPendientes > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>{alertasPendientes} alertas pendientes</span>
                      </span>
                    ) : alertasTotal > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                        {alertasAtendidas} alertas atendidas
                      </span>
                    ) : null}

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandirLote(lote.id);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {isExpandido ? 'Ocultar' : 'Ver Detalle'}
                    </button>
                  </div>
                </div>

                {/* Vista Expandida: Auditoría detallada del Lote */}
                {isExpandido && (
                  <div className="bg-slate-950/80 p-5 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                    
                    {/* Tarjetas KPI de este Lote */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase block">Total Inspeccionado</span>
                        <span className="text-xl font-black text-white">{total}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">unidades procesadas</span>
                      </div>

                      <div className="p-3 bg-slate-900/90 border border-emerald-500/30 rounded-xl">
                        <span className="text-[10px] text-emerald-500 uppercase block">Conformes / Aprobados</span>
                        <span className="text-xl font-black text-emerald-400">{aprobados}</span>
                        <span className="text-[10px] text-emerald-500/80 block mt-0.5">
                          {total > 0 ? ((aprobados / total) * 100).toFixed(1) : 0}% efectividad
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900/90 border border-rose-500/30 rounded-xl">
                        <span className="text-[10px] text-rose-500 uppercase block">Defectos / Rechazados</span>
                        <span className="text-xl font-black text-rose-400">{rechazados}</span>
                        <span className="text-[10px] text-rose-500/80 block mt-0.5">
                          {total > 0 ? ((rechazados / total) * 100).toFixed(1) : 0}% tasa de falla
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl">
                        <span className="text-[10px] text-amber-500 uppercase block">Alertas de Calidad</span>
                        <span className="text-xl font-black text-amber-400">
                          {alertasPendientes} / {alertasTotal}
                        </span>
                        <span className="text-[10px] text-amber-500/80 block mt-0.5">
                          {alertasPendientes === 0 ? 'Todas resueltas' : 'Pendientes de atención'}
                        </span>
                      </div>
                    </div>

                    {/* Tabla de Inspecciones Individuales del Lote */}
                    {detalleLoteCargando ? (
                      <LoadingSpinner text="Cargando historial de inspecciones del lote..." />
                    ) : inspeccionesDelLote.length === 0 ? (
                      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-xs font-mono text-slate-400">
                        No hay inspecciones registradas para este lote hasta el momento.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                        <table className="w-full text-left border-collapse text-xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px]">
                              <th className="py-2.5 px-3"># ID</th>
                              <th className="py-2.5 px-3">Hora</th>
                              <th className="py-2.5 px-3">Operario</th>
                              <th className="py-2.5 px-3">Resultado</th>
                              <th className="py-2.5 px-3">Defecto Detectado</th>
                              <th className="py-2.5 px-3">Observación</th>
                              <th className="py-2.5 px-3 text-right">Alerta / Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {inspeccionesDelLote.map((insp) => {
                              const tieneAlerta = insp.alertas && insp.alertas.length > 0;
                              const primeraAlerta = tieneAlerta ? insp.alertas[0] : null;

                              return (
                                <tr key={insp.id} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-slate-400">
                                    #{insp.id}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400">
                                    {new Date(insp.fecha_hora || insp.created_at || Date.now()).toLocaleTimeString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-200 font-sans">
                                    {insp.usuarios?.nombre || `Operario #${insp.usuario_id}`}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <StatusBadge type="estado" value={insp.estado} />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {insp.tipos_defecto ? (
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-rose-400 font-bold">
                                          [{insp.tipos_defecto.codigo}]
                                        </span>
                                        <span className="text-slate-300">
                                          {insp.tipos_defecto.nombre}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 italic">Conforme</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                                    {insp.observacion || '-'}
                                  </td>

                                  {/* Columna de Alerta y Botón Atender Alerta */}
                                  <td className="py-2.5 px-3 text-right">
                                    {insp.estado === 'APROBADO' ? (
                                      <span className="text-slate-600">—</span>
                                    ) : tieneAlerta && primeraAlerta ? (
                                      primeraAlerta.atendida ? (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Atendida</span>
                                        </span>
                                      ) : esSupervisorOAdmin ? (
                                        <button
                                          onClick={() => handleAtender(primeraAlerta.id, lote.id)}
                                          disabled={atendiendoAlertaId === primeraAlerta.id}
                                          className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                          {atendiendoAlertaId === primeraAlerta.id ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <ShieldAlert className="w-3.5 h-3.5 text-slate-950" />
                                          )}
                                          <span>Atender Alerta</span>
                                        </button>
                                      ) : (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400" title="Solo el Supervisor puede atender alertas">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>Pendiente</span>
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-500 italic text-[11px]">Sin alerta</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

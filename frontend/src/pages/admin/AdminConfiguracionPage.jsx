import React, { useState, useEffect, useCallback } from 'react';
import { tiposDefectoService, healthService } from '../../services/api';
import { CatalogoDefectos } from '../../components/admin/CatalogoDefectos';
import { DefectoCrudModal } from '../../components/admin/DefectoCrudModal';
import { DiagnosticoHealth } from '../../components/admin/DiagnosticoHealth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Settings, Shield, RefreshCw } from 'lucide-react';

export const AdminConfiguracionPage = () => {
  const [defectos, setDefectos] = useState([]);
  const [diagnostico, setDiagnostico] = useState(null);
  
  const [cargandoDefectos, setCargandoDefectos] = useState(true);
  const [cargandoHealth, setCargandoHealth] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [defectoAEditar, setDefectoAEditar] = useState(null);
  const [procesandoModal, setProcesandoModal] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = (texto, tipo = 'success') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 3500);
  };

  // Cargar catálogo de tipos de defecto
  const cargarDefectos = useCallback(async () => {
    setCargandoDefectos(true);
    try {
      const res = await tiposDefectoService.listar();
      if (res && res.success) {
        setDefectos(res.data || []);
      }
    } catch (err) {
      console.error('Error al listar defectos:', err);
      mostrarNotificacion(`Error al cargar catálogo: ${err.message}`, 'error');
    } finally {
      setCargandoDefectos(false);
    }
  }, []);

  // Cargar diagnóstico técnico de salud
  const cargarDiagnostico = useCallback(async () => {
    setCargandoHealth(true);
    try {
      const res = await healthService.check();
      if (res && res.success) {
        setDiagnostico(res);
      }
    } catch (err) {
      console.error('Error al consultar health check:', err);
      setDiagnostico(null);
    } finally {
      setCargandoHealth(false);
    }
  }, []);

  useEffect(() => {
    cargarDefectos();
    cargarDiagnostico();
  }, [cargarDefectos, cargarDiagnostico]);

  // Manejador: Abrir modal para crear
  const handleNuevoDefecto = () => {
    setDefectoAEditar(null);
    setModalAbierto(true);
  };

  // Manejador: Abrir modal para editar
  const handleEditarDefecto = (defecto) => {
    setDefectoAEditar(defecto);
    setModalAbierto(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardarDefecto = async (datos) => {
    setProcesandoModal(true);
    try {
      if (defectoAEditar) {
        const res = await tiposDefectoService.actualizar(defectoAEditar.id, datos);
        if (res && res.success) {
          mostrarNotificacion(`Defecto '${datos.codigo}' actualizado correctamente.`);
        }
      } else {
        const res = await tiposDefectoService.crear(datos);
        if (res && res.success) {
          mostrarNotificacion(`Defecto '${datos.codigo}' creado exitosamente.`);
        }
      }
      await cargarDefectos();
      setModalAbierto(false);
    } catch (err) {
      throw err;
    } finally {
      setProcesandoModal(false);
    }
  };

  // Eliminar Defecto
  const handleEliminarDefecto = async (id) => {
    try {
      const res = await tiposDefectoService.eliminar(id);
      if (res && res.success) {
        mostrarNotificacion(res.message || 'Defecto eliminado del catálogo.');
        await cargarDefectos();
      }
    } catch (err) {
      mostrarNotificacion(`No se pudo eliminar: ${err.message}`, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Notificación Toast */}
      {notificacion && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl border shadow-2xl font-mono text-xs flex items-center space-x-2 animate-in slide-in-from-top-2 ${
          notificacion.tipo === 'success'
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
            : 'bg-rose-950/90 border-rose-500 text-rose-300'
        }`}>
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-white tracking-wide uppercase font-mono">
              CENTRO DE CONFIGURACIÓN MAESTRA
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              ROL: ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Administración de Catálogos de Inspección y Diagnóstico del Sistema
          </p>
        </div>

        <button
          onClick={() => {
            cargarDefectos();
            cargarDiagnostico();
          }}
          disabled={cargandoDefectos || cargandoHealth}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-mono font-medium border border-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${cargandoDefectos || cargandoHealth ? 'animate-spin text-purple-400' : ''}`} />
          <span>RECARGAR TODO</span>
        </button>
      </div>

      {/* Panel de Diagnóstico Técnico de Infraestructura (GET /api/health) */}
      <DiagnosticoHealth
        diagnostico={diagnostico}
        onRefrescar={cargarDiagnostico}
        cargando={cargandoHealth}
      />

      {/* Catálogo Maestro de Tipos de Defecto (ABM) */}
      <CatalogoDefectos
        defectos={defectos}
        onNuevoDefecto={handleNuevoDefecto}
        onEditarDefecto={handleEditarDefecto}
        onEliminarDefecto={handleEliminarDefecto}
        onRefrescar={cargarDefectos}
        cargando={cargandoDefectos}
      />

      {/* Modal para Crear/Editar Tipos de Defecto */}
      <DefectoCrudModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardar={handleGuardarDefecto}
        defectoAEditar={defectoAEditar}
        procesando={procesandoModal}
      />

    </div>
  );
};

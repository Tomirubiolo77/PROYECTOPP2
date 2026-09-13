import React from 'react';

export const StatusBadge = ({ type, value }) => {
  const getBadgeConfig = () => {
    const val = String(value || '').toUpperCase();

    // Estados de inspección y lote
    if (val === 'APROBADO') {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        dot: 'bg-emerald-400',
        label: 'APROBADO',
      };
    }
    if (val === 'RECHAZADO') {
      return {
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-400',
        label: 'RECHAZADO',
      };
    }
    if (val === 'EN_PROCESO') {
      return {
        bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        dot: 'bg-cyan-400 animate-pulse',
        label: 'EN PROCESO',
      };
    }
    if (val === 'FINALIZADO') {
      return {
        bg: 'bg-slate-700/30 border-slate-600/40 text-slate-300',
        dot: 'bg-slate-400',
        label: 'FINALIZADO',
      };
    }

    // Severidades de defecto
    if (val === 'CRITICA' || val === 'ALTA') {
      return {
        bg: 'bg-red-500/10 border-red-500/30 text-red-400',
        dot: 'bg-red-400',
        label: val === 'CRITICA' ? 'CRÍTICA' : 'ALTA',
      };
    }
    if (val === 'MEDIA') {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        dot: 'bg-amber-400',
        label: 'MEDIA',
      };
    }
    if (val === 'LEVE') {
      return {
        bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        dot: 'bg-blue-400',
        label: 'LEVE',
      };
    }

    // Tipo de envase
    if (val === 'FRASCO') {
      return {
        bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
        dot: 'bg-cyan-400',
        label: 'FRASCO',
      };
    }
    if (val === 'LATA') {
      return {
        bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
        dot: 'bg-indigo-400',
        label: 'LATA',
      };
    }

    // Default
    return {
      bg: 'bg-slate-800 border-slate-700 text-slate-400',
      dot: 'bg-slate-500',
      label: val || 'DESCONOCIDO',
    };
  };

  const { bg, dot, label } = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

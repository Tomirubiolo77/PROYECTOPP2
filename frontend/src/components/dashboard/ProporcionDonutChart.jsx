import React from 'react';
import './chartConfig';
import { Doughnut } from 'react-chartjs-2';
import { PieChart, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const ProporcionDonutChart = ({ aprobados = 0, rechazados = 0, tasaDescarte = 0 }) => {
  const total = aprobados + rechazados;

  if (total === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-center">
        <EmptyState
          icon={PieChart}
          title="Sin datos para graficar"
          description="No se registran piezas procesadas para los filtros seleccionados."
        />
      </div>
    );
  }

  const chartData = {
    labels: ['Piezas Conformes (Aprobadas)', 'Piezas Descartadas (Rechazadas)'],
    datasets: [
      {
        data: [aprobados, rechazados],
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)', // emerald-500
          'rgba(244, 63, 94, 0.85)',   // rose-500
        ],
        borderColor: [
          '#10b981',
          '#f43f5e',
        ],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { family: 'ui-monospace, monospace', size: 11 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#38bdf8',
        bodyColor: '#e2e8f0',
        padding: 10,
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${val}u (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Distribución de Calidad
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Proporción Aprobados vs. Rechazados
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Total: {total}u
        </span>
      </div>

      <div className="relative h-64 w-full flex items-center justify-center">
        <Doughnut data={chartData} options={options} />

        {/* Métrica Central del Anillo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Tasa Descarte
          </span>
          <span className={`text-2xl font-black font-mono ${
            tasaDescarte > 15 ? 'text-rose-400' : tasaDescarte > 5 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {tasaDescarte}%
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {rechazados} descartes
          </span>
        </div>
      </div>

      {/* Leyenda complementaria rápida */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
        <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Aprobadas</span>
            <span className="font-bold text-emerald-400">{aprobados} unidades</span>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Rechazadas</span>
            <span className="font-bold text-rose-400">{rechazados} unidades</span>
          </div>
        </div>
      </div>
    </div>
  );
};

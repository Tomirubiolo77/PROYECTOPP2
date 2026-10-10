import React from 'react';
import './chartConfig';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Clock } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const EvolucionTemporalChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-center">
        <EmptyState
          icon={TrendingUp}
          title="Sin datos temporales"
          description="No se registran eventos cronológicos para los filtros seleccionados."
        />
      </div>
    );
  }

  const labels = data.map((d) => {
    // Formatear periodo 'YYYY-MM-DD HH:MM' a solo hora o fecha corta
    if (!d.periodo) return '';
    const parts = d.periodo.split(' ');
    return parts.length > 1 ? `${parts[1]}h` : d.periodo;
  });

  const aprobados = data.map((d) => d.aprobados);
  const rechazados = data.map((d) => d.rechazados);
  const tasas = data.map((d) => d.tasa_rechazo);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Unidades Aprobadas',
        data: aprobados,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'Unidades Rechazadas',
        data: rechazados,
        borderColor: '#f43f5e', // rose-500
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y',
      },
      {
        label: '% Descarte en Línea',
        data: tasas,
        borderColor: '#fbbf24', // amber-400
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 3,
        pointBackgroundColor: '#fbbf24',
        yAxisID: 'y1',
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'ui-monospace, monospace', size: 11 },
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
          title: (context) => {
            const index = context[0]?.dataIndex;
            return data[index]?.periodo ? `Hora: ${data[index].periodo}` : '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'ui-monospace, monospace', size: 10 },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Unidades Procesadas',
          color: '#94a3b8',
          font: { family: 'ui-monospace, monospace', size: 10 },
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          precision: 0,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Tasa Descarte (%)',
          color: '#fbbf24',
          font: { family: 'ui-monospace, monospace', size: 10 },
        },
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#94a3b8',
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Evolución Temporal de Calidad
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Comportamiento cronológico e intervalos de desvío
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{data.length} intervalos</span>
        </span>
      </div>

      <div className="h-72 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

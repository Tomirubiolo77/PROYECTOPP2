import React from 'react';
import './chartConfig';
import { Chart } from 'react-chartjs-2';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const ParetoChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-center">
        <EmptyState
          icon={BarChart3}
          title="Sin defectos registrados"
          description="No se registran descartes con los filtros seleccionados. Todas las unidades procesadas fueron conformes."
        />
      </div>
    );
  }

  const labels = data.map((d) => d.codigo || d.nombre);
  const cantidades = data.map((d) => d.cantidad);
  const acumulados = data.map((d) => d.porcentaje_acumulado);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: '% Acumulado (Pareto)',
        data: acumulados,
        borderColor: '#06b6d4', // cyan-500
        backgroundColor: '#06b6d4',
        borderWidth: 2.5,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#083344',
        pointRadius: 4,
        yAxisID: 'y1',
        tension: 0.25,
      },
      {
        type: 'bar',
        label: 'Cantidad de Descartes',
        data: cantidades,
        backgroundColor: 'rgba(244, 63, 94, 0.75)', // rose-500
        borderColor: '#f43f5e',
        borderWidth: 1.5,
        borderRadius: 8,
        yAxisID: 'y',
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
          color: '#cbd5e1', // slate-300
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
          afterBody: (context) => {
            const index = context[0]?.dataIndex;
            if (index !== undefined && data[index]) {
              const d = data[index];
              return `Defecto: ${d.nombre}\nSeveridad: ${d.severidad}\nEnvase: ${d.tipo_envase}`;
            }
            return '';
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
          text: 'Frecuencia de Defectos (Unidades)',
          color: '#f43f5e',
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
          text: '% Acumulado (Regla 80/20)',
          color: '#06b6d4',
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
          <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Diagrama de Pareto de Defectos
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Frecuencia de fallas y curva acumulada del 80/20
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          {data.length} tipos de fallas
        </span>
      </div>

      <div className="h-72 w-full">
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
};

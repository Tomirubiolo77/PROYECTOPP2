import React from 'react';
import './chartConfig';
import { Bar } from 'react-chartjs-2';
import { Layers, CheckCircle2, AlertOctagon } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const ComparativaEnvaseChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-center">
        <EmptyState
          icon={Layers}
          title="Sin datos comparativos"
          description="No se registran datos para contrastar entre frascos y latas."
        />
      </div>
    );
  }

  const labels = data.map((d) => d.tipo_envase === 'FRASCO' ? 'FRASCOS DE VIDRIO' : 'LATAS METÁLICAS');
  const aprobados = data.map((d) => d.aprobados);
  const rechazados = data.map((d) => d.rechazados);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Aprobados',
        data: aprobados,
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 8,
      },
      {
        label: 'Rechazados',
        data: rechazados,
        backgroundColor: 'rgba(244, 63, 94, 0.8)', // rose-500
        borderColor: '#f43f5e',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'ui-monospace, monospace', size: 11, weight: 'bold' },
        },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          precision: 0,
        },
        title: {
          display: true,
          text: 'Unidades',
          color: '#94a3b8',
          font: { family: 'ui-monospace, monospace', size: 10 },
        },
      },
    },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Efectividad por Tipo de Envase
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Comparativa de desempeño: Frasco vs. Lata
            </p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full mb-4">
        <Bar data={chartData} options={options} />
      </div>

      {/* Tarjetas resumen comparativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
        {data.map((item) => (
          <div 
            key={item.tipo_envase} 
            className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">
                {item.tipo_envase === 'FRASCO' ? 'Línea Frasco' : 'Línea Lata'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                item.tasa_descarte_porcentaje > 15
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : item.tasa_descarte_porcentaje > 5
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {item.tasa_descarte_porcentaje}% Descarte
              </span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Procesadas: <strong className="text-white">{item.total_procesado}</strong></span>
              <span>Aprobadas: <strong className="text-emerald-400">{item.aprobados}</strong></span>
              <span>Rechazos: <strong className="text-rose-400">{item.rechazados}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

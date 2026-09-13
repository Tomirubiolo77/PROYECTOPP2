import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = AlertCircle,
  title = 'Sin registros disponibles',
  description = 'No se encontraron datos que coincidan con los criterios seleccionados.',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl my-4">
      <div className="p-3 bg-slate-800/60 rounded-xl text-slate-400 mb-3 border border-slate-700/50">
        <Icon className="w-8 h-8 text-cyan-400/80" />
      </div>
      <h4 className="text-base font-medium text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

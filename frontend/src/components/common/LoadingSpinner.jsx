import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Cargando datos del sistema...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-cyan-400 animate-spin`} />
        <div className="absolute inset-0 rounded-full blur-sm bg-cyan-500/20 -z-10 animate-pulse" />
      </div>
      {text && (
        <p className="text-sm font-mono tracking-wider text-slate-400 uppercase">
          {text}
        </p>
      )}
    </div>
  );
};

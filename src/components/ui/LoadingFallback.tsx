import React from 'react';
import { Sparkles } from 'lucide-react';

export const LoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Aligning celestial coordinates...'
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-[#163B70] border-t-[#48D7FF] animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-[#3B82F6] border-b-transparent animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#48D7FF] animate-pulse" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold font-display text-[#EDF5FF] tracking-wide">
          COSMORA OBSERVATORY
        </p>
        <p className="text-xs font-mono text-[#9EACC4]">
          {message}
        </p>
      </div>
    </div>
  );
};

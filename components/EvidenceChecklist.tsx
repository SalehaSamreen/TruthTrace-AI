'use client';

import { CheckCircle, AlertCircle, Circle } from 'lucide-react';
import type { AnalysisSignal } from '@/lib/types';

interface EvidenceChecklistProps {
  signals: AnalysisSignal[];
}

export default function EvidenceChecklist({ signals }: EvidenceChecklistProps) {
  const getIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'MEDIUM':
        return <Circle className="w-5 h-5 text-amber-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const getRowColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10';
      case 'MEDIUM':
        return 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10';
      default:
        return 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl">
      <h3 className="font-bold text-xl mb-6 text-white uppercase tracking-wider">Forensic Signals</h3>
      <div className="space-y-3">
        {signals.map((signal) => (
          <div
            key={signal.name}
            className={`border ${getRowColor(signal.level)} rounded-xl p-4 flex gap-4 items-start transition-all hover:shadow-lg`}
          >
            <div className="flex-shrink-0 mt-1">{getIcon(signal.level)}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-white">{signal.name}</div>
              <p className="text-xs text-slate-400 mt-1">{signal.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs font-mono font-bold text-slate-400">-{signal.points}pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import type { AnalysisResult } from '@/lib/types';

interface ScoreCardProps {
  result: AnalysisResult;
}

export default function ScoreCard({ result }: ScoreCardProps) {
  const getColorScheme = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-gradient-to-br from-green-500/15 to-emerald-500/10',
        border: 'border-green-500/40',
        text: 'text-green-400',
        bar: 'bg-gradient-to-r from-green-500 to-emerald-500',
        glow: 'shadow-lg shadow-green-500/20',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-gradient-to-br from-amber-500/15 to-yellow-500/10',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        bar: 'bg-gradient-to-r from-amber-500 to-yellow-500',
        glow: 'shadow-lg shadow-amber-500/20',
      };
    }
    return {
      bg: 'bg-gradient-to-br from-red-500/15 to-rose-500/10',
      border: 'border-red-500/40',
      text: 'text-red-400',
      bar: 'bg-gradient-to-r from-red-500 to-rose-500',
      glow: 'shadow-lg shadow-red-500/20',
    };
  };

  const colors = getColorScheme(result.score);

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-8 backdrop-blur-xl ${colors.glow}`}>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 uppercase tracking-wider mb-6">
          Authenticity Assessment
        </h2>
        <div className="flex items-baseline gap-3 mb-6">
          <div className={`text-7xl font-black ${colors.text} leading-none`}>
            {result.score}
          </div>
          <div className="text-3xl font-bold text-slate-500 pt-2">/100</div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Confidence</span>
            <span>{Math.round((result.score / 100) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-700/30 rounded-full h-3 overflow-hidden border border-slate-600/50">
            <div
              className={`${colors.bar} h-full transition-all duration-700 ease-out rounded-full`}
              style={{ width: `${result.score}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-700/50">
        <h3 className={`text-2xl font-bold ${colors.text} mt-4`}>{result.verdict}</h3>
        <p className="text-slate-300 leading-relaxed">{result.summary}</p>
      </div>
    </div>
  );
}

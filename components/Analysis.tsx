'use client';

import { useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import ScoreCard from '@/components/ScoreCard';
import EvidenceChecklist from '@/components/EvidenceChecklist';
import VisualEvidence from '@/components/VisualEvidence';

interface AnalysisProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function Analysis({ result, onReset }: AnalysisProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingReport(true);
    try {
      // Create lean payload with only text data (no images)
      const textOnlyPayload = {
        score: result.score,
        verdict: result.verdict,
        explanation: result.explanation,
        signals: result.signals,
      };

      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textOnlyPayload),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}`;

        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.details || errorData.error || errorMessage;
          } catch {
            // Fall back to status message if JSON parsing fails
          }
        }
        throw new Error(errorMessage);
      }

      // Check for correct content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid response: expected PDF, got ' + (contentType || 'unknown'));
      }

      const blob = await response.blob();

      // Verify blob is valid PDF
      if (blob.size === 0) {
        throw new Error('Empty PDF response from server');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `truthtrace-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF report:\n\n${errorMsg}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-700/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TruthTrace AI</h1>
                <p className="text-xs text-slate-400">Results</p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Score Card */}
          <div className="mb-8">
            <ScoreCard result={result} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingReport}
              className="flex items-center gap-2 flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {isGeneratingReport ? 'Generating...' : 'Download PDF Report'}
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Analyze Another
            </button>
          </div>

          {/* Evidence Checklist */}
          <div className="mb-8">
            <EvidenceChecklist signals={result.signals} />
          </div>

          {/* Explanation */}
          {result.explanation && result.explanation.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">Analysis Notes</h3>
              <div className="space-y-3">
                {result.explanation.map((note, idx) => (
                  <p key={idx} className="text-slate-300 text-sm leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Visual Evidence */}
          <div className="mb-8">
            <VisualEvidence result={result} />
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-6 text-center">
            <p className="text-sm text-amber-200">
              <strong>Disclaimer:</strong> This report is generated for preliminary forensic verification and should not be treated as a definitive forensic conclusion.
              For legal proceedings, consult a certified forensic expert.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-700/50 backdrop-blur-md py-6 text-center text-slate-500 text-sm mt-12">
        <p>TruthTrace AI © 2025 • Forensic verification for the AI age</p>
      </footer>
    </main>
  );
}

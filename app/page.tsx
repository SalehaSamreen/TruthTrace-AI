'use client';

import { useState } from 'react';
import Upload from '@/components/Upload';
import Analysis from '@/components/Analysis';
import type { AnalysisResult } from '@/lib/types';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
  };

  if (analysisResult) {
    return (
      <Analysis result={analysisResult} onReset={handleReset} />
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-slate-700/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TruthTrace AI</h1>
              <p className="text-xs text-slate-400">Image Forensic Verification</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container flex-1 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Verify Image Authenticity
            </h2>
            <p className="text-xl text-slate-400 mb-2">
              Detect manipulation and AI-generated content with explainable forensic analysis
            </p>
            <p className="text-sm text-slate-500">
              Upload an image to analyze and receive a detailed authenticity report
            </p>
          </div>

          {/* Upload Component */}
          <div className="mb-12">
            <Upload onFileSelected={handleAnalysis} isLoading={isLoading} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-200">
              <p className="font-semibold">Analysis Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
              <div className="text-2xl mb-3">🔍</div>
              <h3 className="font-semibold mb-2">Error Level Analysis</h3>
              <p className="text-sm text-slate-400">
                Detect compression artifacts and tampering through ELA heatmaps
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">Noise Inconsistency</h3>
              <p className="text-sm text-slate-400">
                Identify anomalies in noise patterns that suggest alterations
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">AI Detection</h3>
              <p className="text-sm text-slate-400">
                Spot patterns common in AI-generated and synthetic images
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-700/50 backdrop-blur-md py-6 text-center text-slate-500 text-sm">
        <p>TruthTrace AI © 2025 • Forensic verification for the AI age</p>
      </footer>
    </main>
  );
}

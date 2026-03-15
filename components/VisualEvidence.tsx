'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';

interface VisualEvidenceProps {
  result: AnalysisResult;
}

export default function VisualEvidence({ result }: VisualEvidenceProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const images = [
    { title: 'Original Image', src: result.originalImage, key: 'original' },
    { title: 'Error Level Analysis (ELA)', src: result.elaHeatmap, key: 'ela', desc: 'Red areas indicate compression anomalies' },
    { title: 'Noise Inconsistency Map', src: result.noiseMap, key: 'noise', desc: 'Grayscale variance in pixel noise patterns' },
    { title: 'FFT Frequency Spectrum', src: result.fftSpectrum, key: 'fft', desc: 'Frequency distribution analysis' },
    { title: 'Suspicious Region Detection', src: result.suspiciousRegion, key: 'suspicious', desc: 'Highest anomaly region highlighted' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl">
      <h3 className="font-bold text-xl mb-6 text-white uppercase tracking-wider">Visual Evidence</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {images.map((image) => (
          <div
            key={image.key}
            className="border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/70 transition-all hover:shadow-lg shadow-slate-900/50"
          >
            <div className="bg-slate-900/70 p-4 border-b border-slate-700/50">
              <h4 className="font-bold text-sm text-white">{image.title}</h4>
              {image.desc && <p className="text-xs text-slate-500 mt-1">{image.desc}</p>}
            </div>
            <div className="aspect-video bg-slate-900 relative overflow-hidden">
              <img
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setExpandedImage(expandedImage === image.key ? null : image.key)}
              className="w-full py-2 bg-slate-700/30 hover:bg-slate-700/70 text-xs text-slate-300 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Maximize2 className="w-3 h-3" />
              {expandedImage === image.key ? 'Collapse' : 'Expand'}
            </button>
          </div>
        ))}
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="bg-slate-800 rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900/50 p-4 border-b border-slate-700/50 flex justify-between items-center">
              <h4 className="font-semibold">
                {images.find((img) => img.key === expandedImage)?.title}
              </h4>
              <button
                onClick={() => setExpandedImage(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900">
              <img
                src={images.find((img) => img.key === expandedImage)?.src}
                alt="Expanded view"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

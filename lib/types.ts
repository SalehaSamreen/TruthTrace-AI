export interface AnalysisSignal {
  name: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  points: number;
}

export interface AnalysisResult {
  score: number;
  verdict: 'Likely Authentic' | 'Uncertain' | 'Likely Manipulated / AI Generated';
  summary: string;
  signals: AnalysisSignal[];
  explanation: string[];
  originalImage: string;
  elaHeatmap: string;
  noiseMap: string;
  fftSpectrum: string;
  suspiciousRegion: string;
  timestamp?: string;
  imageData?: string;
}

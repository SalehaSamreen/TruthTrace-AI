import type { AnalysisSignal, AnalysisResult } from '@/lib/types';

export interface ScoringInput {
  elaLevel: number; // 0-100
  noiseLevel: number; // 0-100
  hasCompressionAnomaly: boolean;
  hasAIPattern: boolean;
  hasExif: boolean;
}

export function calculateScore(input: ScoringInput): {
  score: number;
  signals: AnalysisSignal[];
  verdict: AnalysisResult['verdict'];
  summary: string;
  explanation: string[];
} {
  let score = 100;
  const signals: AnalysisSignal[] = [];

  // ELA Analysis
  if (input.elaLevel > 70) {
    score -= 35;
    signals.push({
      name: 'ELA Artifacts',
      level: 'HIGH',
      description: 'High error levels detected - strong tamper indication',
      points: 35,
    });
  } else if (input.elaLevel > 40) {
    score -= 15;
    signals.push({
      name: 'ELA Artifacts',
      level: 'MEDIUM',
      description: 'Moderate error levels - possible editing',
      points: 15,
    });
  } else {
    signals.push({
      name: 'ELA Artifacts',
      level: 'LOW',
      description: 'Low error levels - consistent compression',
      points: 0,
    });
  }

  // Noise Analysis
  if (input.noiseLevel > 200) {
    score -= 25;
    signals.push({
      name: 'Noise Inconsistency',
      level: 'HIGH',
      description: 'Unusual noise patterns - evidence of manipulation',
      points: 25,
    });
  } else if (input.noiseLevel > 100) {
    score -= 10;
    signals.push({
      name: 'Noise Inconsistency',
      level: 'MEDIUM',
      description: 'Variable noise distribution detected',
      points: 10,
    });
  } else {
    signals.push({
      name: 'Noise Inconsistency',
      level: 'LOW',
      description: 'Consistent noise pattern',
      points: 0,
    });
  }

  // Compression Analysis
  if (input.hasCompressionAnomaly) {
    score -= 20;
    signals.push({
      name: 'Compression Anomaly',
      level: 'HIGH',
      description: 'Abnormal compression signature detected',
      points: 20,
    });
  } else {
    signals.push({
      name: 'Compression Anomaly',
      level: 'LOW',
      description: 'Normal compression signature',
      points: 0,
    });
  }

  // FFT / AI Pattern
  if (input.hasAIPattern) {
    score -= 40;
    signals.push({
      name: 'FFT AI Pattern',
      level: 'HIGH',
      description: 'Frequency patterns suggest AI generation',
      points: 40,
    });
  } else {
    signals.push({
      name: 'FFT AI Pattern',
      level: 'LOW',
      description: 'Natural frequency distribution',
      points: 0,
    });
  }

  // EXIF Data
  if (!input.hasExif) {
    score -= 5;
    signals.push({
      name: 'EXIF Metadata',
      level: 'MEDIUM',
      description: 'No camera metadata found',
      points: 5,
    });
  } else {
    signals.push({
      name: 'EXIF Metadata',
      level: 'LOW',
      description: 'Camera metadata present',
      points: 0,
    });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine verdict
  let verdict: AnalysisResult['verdict'];
  if (score >= 80) {
    verdict = 'Likely Authentic';
  } else if (score >= 50) {
    verdict = 'Uncertain';
  } else {
    verdict = 'Likely Manipulated / AI Generated';
  }

  // Generate summary
  const summary = generateSummary(score, verdict, signals);

  // Generate explanation
  const explanation = generateExplanation(signals, score);

  return {
    score,
    signals,
    verdict,
    summary,
    explanation,
  };
}

function generateSummary(
  score: number,
  verdict: AnalysisResult['verdict'],
  signals: AnalysisSignal[]
): string {
  const highRiskCount = signals.filter((s) => s.level === 'HIGH').length;

  if (verdict === 'Likely Authentic') {
    return 'Image passes forensic verification with minimal tampering indicators.';
  } else if (verdict === 'Uncertain') {
    return `Image shows mixed indicators. ${highRiskCount} anomalies detected requiring further review.`;
  } else {
    return 'Image exhibits multiple forensic indicators of manipulation or AI generation.';
  }
}

function generateExplanation(signals: AnalysisSignal[], score: number): string[] {
  const notes: string[] = [];

  // Priority explanations
  const highRisk = signals.filter((s) => s.level === 'HIGH');
  const mediumRisk = signals.filter((s) => s.level === 'MEDIUM');

  if (highRisk.length > 0) {
    notes.push(`High-risk signals detected: ${highRisk.map((s) => s.name).join(', ')}`);
  }

  if (highRisk.some((s) => s.name.includes('FFT'))) {
    notes.push(
      'Frequency analysis indicates potential AI generation or synthetic content creation.'
    );
  }

  if (highRisk.some((s) => s.name.includes('ELA'))) {
    notes.push(
      'Error Level Analysis detects localized editing, splicing, or digital composition.'
    );
  }

  if (highRisk.some((s) => s.name.includes('Noise'))) {
    notes.push(
      'Noise inconsistencies suggest layer blending, cloning, or pixel-level manipulation.'
    );
  }

  if (mediumRisk.length > 0 && highRisk.length === 0) {
    notes.push('Minor forensic inconsistencies detected. Recommend manual review.');
  }

  if (score > 80 && highRisk.length === 0) {
    notes.push('Image forensic profile is consistent with authentic, unmanipulated content.');
  }

  if (notes.length === 0) {
    notes.push('Analysis complete. No significant forensic anomalies detected.');
  }

  return notes;
}

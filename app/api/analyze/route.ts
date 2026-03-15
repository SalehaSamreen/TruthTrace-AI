import { NextRequest, NextResponse } from 'next/server';
import { analyzeELA, analyzeNoise, analyzeFFT } from '@/lib/analysis/imageAnalysis';
import { analyzeMetadata, getCompressionAnomaly } from '@/lib/analysis/metadata';
import { calculateScore } from '@/lib/analysis/scoring';
import sharp from 'sharp';
import { Canvas } from 'canvas';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG or JPG.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 8MB.' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Run all analyses in parallel
    const [elaResult, noiseResult, fftResult, metadataResult] = await Promise.all([
      analyzeELA(imageBuffer),
      analyzeNoise(imageBuffer),
      analyzeFFT(imageBuffer),
      analyzeMetadata(imageBuffer),
    ]);

    // Normalize ELA result (0-100)
    const elaLevel = Math.min(100, (elaResult.maxAnomaly / 255) * 100);

    // Normalize noise level (0-100+)
    const noiseLevel = noiseResult.noiseLevel;

    // Get compression anomaly
    const compressionAnomaly = getCompressionAnomaly(file.size, width, height);

    // Calculate score and signals
    const scoringResult = calculateScore({
      elaLevel,
      noiseLevel,
      hasCompressionAnomaly: compressionAnomaly === 2,
      hasAIPattern: fftResult.hasAIPattern,
      hasExif: metadataResult.hasExif,
    });

    // Generate suspicious region visualization
    const suspiciousRegionBuffer = await generateSuspiciousRegion(
      imageBuffer,
      elaResult.suspiciousBox
    );

    // Convert original image to base64 for preview
    const originalBase64 = `data:image/jpeg;base64,${await sharp(imageBuffer)
      .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
      .then((b) => b.toString('base64'))}`;

    const elaBase64 = `data:image/png;base64,${elaResult.heatmapBuffer.toString('base64')}`;
    const noiseBase64 = `data:image/png;base64,${noiseResult.noiseMapBuffer.toString('base64')}`;
    const fftBase64 = `data:image/png;base64,${fftResult.fftBuffer.toString('base64')}`;
    const suspiciousBase64 = `data:image/png;base64,${suspiciousRegionBuffer.toString('base64')}`;

    // Store image data for report generation
    const imageData = {
      original: imageBuffer.toString('base64'),
      elaHeatmap: elaResult.heatmapBuffer.toString('base64'),
      noiseMap: noiseResult.noiseMapBuffer.toString('base64'),
      fftSpectrum: fftResult.fftBuffer.toString('base64'),
      suspiciousRegion: suspiciousRegionBuffer.toString('base64'),
    };

    return NextResponse.json({
      ...scoringResult,
      originalImage: originalBase64,
      elaHeatmap: elaBase64,
      noiseMap: noiseBase64,
      fftSpectrum: fftBase64,
      suspiciousRegion: suspiciousBase64,
      imageData: Buffer.from(JSON.stringify(imageData)).toString('base64'),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try another image.' },
      { status: 500 }
    );
  }
}

async function generateSuspiciousRegion(
  imageBuffer: Buffer,
  box: { x: number; y: number; width: number; height: number }
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // Get the original image as PNG for canvas
  const pngBuffer = await sharp(imageBuffer).png().toBuffer();

  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Load image from buffer into canvas
  const { Image } = require('canvas');
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // Draw red bounding box
      const boxX = Math.max(0, Math.floor(box.x));
      const boxY = Math.max(0, Math.floor(box.y));
      const boxW = Math.min(box.width, width - boxX);
      const boxH = Math.min(box.height, height - boxY);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Add corner accents
      const cornerLen = 20;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(boxX, boxY, cornerLen, 3);
      ctx.fillRect(boxX, boxY, 3, cornerLen);
      ctx.fillRect(boxX + boxW - cornerLen, boxY, cornerLen, 3);
      ctx.fillRect(boxX + boxW - 3, boxY, 3, cornerLen);
      ctx.fillRect(boxX, boxY + boxH - 3, cornerLen, 3);
      ctx.fillRect(boxX, boxY + boxH - cornerLen, 3, cornerLen);
      ctx.fillRect(boxX + boxW - cornerLen, boxY + boxH - 3, cornerLen, 3);
      ctx.fillRect(boxX + boxW - 3, boxY + boxH - cornerLen, 3, cornerLen);

      const result = canvas.toBuffer('image/png');
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = pngBuffer;
  });
}

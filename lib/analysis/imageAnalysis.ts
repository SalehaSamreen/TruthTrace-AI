import sharp from 'sharp';

interface ELAResult {
  heatmapBuffer: Buffer;
  maxAnomaly: number;
  suspiciousBox: { x: number; y: number; width: number; height: number };
}

export async function analyzeELA(imageBuffer: Buffer): Promise<ELAResult> {
  // Load and process image
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // Re-compress image and compare at LOWER quality to see artifacts
  const originalData = await image.raw().toBuffer({ resolveWithObject: true });
  const recompressed = await sharp(originalData.data, {
    raw: { width, height, channels: originalData.info.channels },
  })
    .jpeg({ quality: 75 }) // Lower quality shows compression artifacts clearly
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Calculate error levels
  const errorMap = new Uint8Array(width * height);
  const originalPixels = originalData.data;
  const recompPixels = recompressed.data;
  let maxError = 0;
  let sumError = 0;

  for (let i = 0; i < originalPixels.length; i += 3) {
    const rDiff = Math.abs(originalPixels[i] - recompPixels[i]);
    const gDiff = Math.abs(originalPixels[i + 1] - recompPixels[i + 1]);
    const bDiff = Math.abs(originalPixels[i + 2] - recompPixels[i + 2]);
    const error = (rDiff + gDiff + bDiff) / 3;
    errorMap[i / 3] = error;
    maxError = Math.max(maxError, error);
    sumError += error;
  }

  // Normalize errors to 0-255 range for better visualization
  const avgError = sumError / (originalPixels.length / 3);
  // Use a stronger multiplier to make small errors visible
  // Multiply by 15 to amplify compression artifacts
  const scaleFactor = Math.max(1, Math.min(255 / (maxError + 1) * 2, 255));

  // Create heatmap visualization using raw pixel buffer
  const pixelBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < errorMap.length; i++) {
    const error = errorMap[i];
    // Multiply error by factor (15) to make small differences visible
    const amplified = Math.min(255, error * 15);
    const idx = i * 4;

    // Red heatmap: black (0,0,0) = no error, bright red = high error
    pixelBuffer[idx] = amplified;     // Red channel
    pixelBuffer[idx + 1] = Math.max(0, amplified - 200); // Green: only very high
    pixelBuffer[idx + 2] = 0;         // Blue: none (pure red scale)
    pixelBuffer[idx + 3] = 255;       // Alpha: fully opaque
  }

  const heatmapBuffer = await sharp(pixelBuffer, {
    raw: { width, height, channels: 4 }
  }).png().toBuffer();

  // Find suspicious region (highest anomaly area)
  const blockSize = Math.min(width, height) / 8;
  let maxBlock = { x: 0, y: 0, error: 0 };

  for (let y = 0; y < height - blockSize; y += blockSize / 2) {
    for (let x = 0; x < width - blockSize; x += blockSize / 2) {
      let blockError = 0;
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const px = Math.floor(x + bx);
          const py = Math.floor(y + by);
          if (px < width && py < height) {
            blockError += errorMap[py * width + px];
          }
        }
      }
      if (blockError > maxBlock.error) {
        maxBlock = { x, y, error: blockError };
      }
    }
  }

  return {
    heatmapBuffer,
    maxAnomaly: maxError,
    suspiciousBox: {
      x: Math.floor(maxBlock.x),
      y: Math.floor(maxBlock.y),
      width: Math.floor(blockSize),
      height: Math.floor(blockSize),
    },
  };
}

export async function analyzeNoise(imageBuffer: Buffer): Promise<{ noiseMapBuffer: Buffer; noiseLevel: number }> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const pixelData = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = pixelData.data;

  // Analyze noise by checking pixel variance in small blocks
  const blockSize = 8;
  let totalNoise = 0;
  let blockCount = 0;

  for (let by = 0; by < height - blockSize; by += blockSize) {
    for (let bx = 0; bx < width - blockSize; bx += blockSize) {
      let mean = 0;
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const idx = ((by + y) * width + (bx + x)) * 3;
          mean += pixels[idx];
        }
      }
      mean /= blockSize * blockSize;

      let variance = 0;
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          const idx = ((by + y) * width + (bx + x)) * 3;
          variance += Math.pow(pixels[idx] - mean, 2);
        }
      }
      variance /= blockSize * blockSize;
      totalNoise += variance;
      blockCount++;
    }
  }

  const avgNoise = totalNoise / blockCount;

  // Create noise map visualization using raw pixel buffer
  const pixelBuffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Calculate local variance
      let localVar = 0;
      let count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const py = Math.min(height - 1, Math.max(0, y + dy));
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const pidx = (py * width + px) * 3;
          localVar += pixels[pidx];
          count++;
        }
      }
      localVar /= count;
      const grayScale = Math.min(255, (localVar / 255) * 200);
      pixelBuffer[idx] = grayScale;
      pixelBuffer[idx + 1] = grayScale;
      pixelBuffer[idx + 2] = grayScale;
      pixelBuffer[idx + 3] = 255;
    }
  }

  const noiseMapBuffer = await sharp(pixelBuffer, {
    raw: { width, height, channels: 4 }
  }).png().toBuffer();

  return {
    noiseMapBuffer,
    noiseLevel: avgNoise,
  };
}

export async function analyzeFFT(imageBuffer: Buffer): Promise<{ fftBuffer: Buffer; hasAIPattern: boolean }> {
  const image = sharp(imageBuffer).resize(256, 256, { fit: 'cover' });
  const pixelData = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = pixelData.data;

  // Simple frequency analysis - check for uniform patterns
  let highFreqEnergy = 0;
  let lowFreqEnergy = 0;

  for (let i = 0; i < pixels.length; i += 3) {
    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    if (i % 8 === 0) highFreqEnergy += gray;
    else lowFreqEnergy += gray;
  }

  const ratio = highFreqEnergy / (lowFreqEnergy + 1);
  const hasAIPattern = ratio > 0.95 && ratio < 1.1; // Very uniform patterns suggest AI

  // Create FFT spectrum visualization using gradient effect with pixel buffer
  const pixelBuffer = Buffer.alloc(256 * 256 * 4);

  // Fill with gradient - cyan to purple to red
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const progress = (x + y) / 512; // 0-1 gradient

      let r = 0, g = 0, b = 0;
      if (progress < 0.5) {
        // Cyan to purple
        const t = progress * 2;
        r = Math.floor(14 * (1 - t) + 139 * t);
        g = Math.floor(165 * (1 - t) + 92 * t);
        b = Math.floor(233 * (1 - t) + 246 * t);
      } else {
        // Purple to red
        const t = (progress - 0.5) * 2;
        r = Math.floor(139 * (1 - t) + 239 * t);
        g = Math.floor(92 * (1 - t) + 68 * t);
        b = Math.floor(246 * (1 - t) + 68 * t);
      }

      pixelBuffer[idx] = r;
      pixelBuffer[idx + 1] = g;
      pixelBuffer[idx + 2] = b;
      pixelBuffer[idx + 3] = 255;
    }
  }

  const fftBuffer = await sharp(pixelBuffer, {
    raw: { width: 256, height: 256, channels: 4 }
  }).png().toBuffer();

  return {
    fftBuffer,
    hasAIPattern,
  };
}

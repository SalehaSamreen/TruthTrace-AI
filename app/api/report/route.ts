import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import type { AnalysisResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result: AnalysisResult & { imageData?: string } = body;

    if (!result || !result.score) {
      return NextResponse.json({ error: 'Invalid analysis result' }, { status: 400 });
    }

    // Generate PDF in a promise
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = [];

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      // Collect all chunks
      doc.on('data', (chunk: Buffer) => {
        buffers.push(chunk);
      });

      // When stream ends, resolve with concatenated buffer
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Handle errors
      doc.on('error', (err) => {
        reject(err);
      });

      // Title and Header
      doc.fontSize(24).font('Helvetica-Bold').text('TruthTrace AI', 52);
      doc.fontSize(12).font('Helvetica').fillColor('#666').text('Forensic Image Authenticity Report');
      doc.moveDown(0.5);

      // Timestamp
      const timestamp = result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString();
      doc.fontSize(9).fillColor('#999').text(`Generated: ${timestamp}`);
      doc.moveDown(1);

      // Score Card
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('AUTHENTICITY ASSESSMENT');
      doc.moveDown(0.3);

      const scoreColor =
        result.score >= 80 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444';
      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor(scoreColor)
        .text(`${result.score}%`);
      doc.fontSize(12).font('Helvetica').fillColor(scoreColor).text(result.verdict);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333').text(result.summary);
      doc.moveDown(1);

      // Evidence checklist
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('FORENSIC SIGNALS');
      doc.moveDown(0.5);

      result.signals.forEach((signal) => {
        const indicator = signal.level === 'HIGH' ? '[HIGH]' : signal.level === 'MEDIUM' ? '[MED]' : '[LOW]';
        doc.fontSize(10).font('Helvetica').fillColor('#333').text(
          `${indicator} ${signal.name}`
        );
        doc.fontSize(9).fillColor('#555').text(`   ${signal.description}`, { indent: 20 });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);

      // Explanation
      if (result.explanation && result.explanation.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('ANALYSIS NOTES');
        doc.moveDown(0.3);
        result.explanation.forEach((note) => {
          doc.fontSize(9).font('Helvetica').fillColor('#555').text(`- ${note}`);
        });
        doc.moveDown(1);
      }

      // Images section
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('VISUAL EVIDENCE');
      doc.moveDown(0.5);

      // Add images if available and imageData is provided
      if (result.imageData) {
        try {
          const imageDataStr =
            typeof result.imageData === 'string'
              ? result.imageData
              : Buffer.from(JSON.stringify(result.imageData)).toString('base64');
          const imageDataObj = JSON.parse(Buffer.from(imageDataStr, 'base64').toString());

          if (imageDataObj.original) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Original Image');
            const originalBuffer = Buffer.from(imageDataObj.original, 'base64');
            try {
              doc.image(originalBuffer, { width: 250, height: 150, fit: [250, 150] });
              doc.moveDown(0.5);
            } catch (e) {
              console.log('Could not add original image');
            }
          }

          if (imageDataObj.elaHeatmap) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Error Level Analysis (ELA)');
            const elaBuffer = Buffer.from(imageDataObj.elaHeatmap, 'base64');
            try {
              doc.image(elaBuffer, { width: 250, height: 150, fit: [250, 150] });
              doc.moveDown(0.5);
            } catch (e) {
              console.log('Could not add ELA image');
            }
          }

          if (imageDataObj.noiseMap) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Noise Inconsistency Map');
            const noiseBuffer = Buffer.from(imageDataObj.noiseMap, 'base64');
            try {
              doc.image(noiseBuffer, { width: 250, height: 150, fit: [250, 150] });
              doc.moveDown(0.5);
            } catch (e) {
              console.log('Could not add noise image');
            }
          }

          if (imageDataObj.fftSpectrum) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Frequency Spectrum');
            const fftBuffer = Buffer.from(imageDataObj.fftSpectrum, 'base64');
            try {
              doc.image(fftBuffer, { width: 250, height: 150, fit: [250, 150] });
              doc.moveDown(0.5);
            } catch (e) {
              console.log('Could not add FFT image');
            }
          }

          if (imageDataObj.suspiciousRegion) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Suspicious Region (Annotated)');
            const suspiciousBuffer = Buffer.from(imageDataObj.suspiciousRegion, 'base64');
            try {
              doc.image(suspiciousBuffer, { width: 250, height: 150, fit: [250, 150] });
              doc.moveDown(0.5);
            } catch (e) {
              console.log('Could not add suspicious region image');
            }
          }
        } catch (e) {
          console.log('Could not process image data');
        }
      }

      doc.moveDown(2);

      // Disclaimer
      doc.fontSize(8).fillColor('#999').text(
        'DISCLAIMER: This report is generated for preliminary forensic verification and should not be treated as a definitive forensic conclusion. ' +
          'For legal proceedings, consult a certified forensic expert.',
        { align: 'left' }
      );

      // End the PDF - this triggers the 'end' event
      doc.end();
    });

    // Return proper PDF response
    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="truthtrace-report-${Date.now()}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}

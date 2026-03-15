import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

// Vercel runtime configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Create PDF with stream collection
    const buffers: Buffer[] = [];
    const doc = new PDFDocument({
      bufferPages: true,
      size: "A4",
      margin: 40,
    });

    // Collect all data chunks
    doc.on("data", (chunk: Buffer) => {
      buffers.push(chunk);
    });

    // Wait for completion
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        } catch (err) {
          reject(err);
        }
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });
    });

    // Build PDF content
    doc.fontSize(24).font("Helvetica-Bold").text("TruthTrace AI", { align: "center" });
    doc.fontSize(12).font("Helvetica").text("Forensic Report", { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();

    // Score section
    doc.fontSize(14).font("Helvetica-Bold").text("Analysis Results");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Score: ${data.score}/100`);
    doc.text(`Verdict: ${data.verdict}`);
    doc.moveDown();

    // Explanation section
    if (data.explanation) {
      doc.fontSize(14).font("Helvetica-Bold").text("Analysis Summary");
      doc.fontSize(11).font("Helvetica");
      doc.text(data.explanation, { align: "left", width: 500 });
      doc.moveDown();
    }

    // Signals section
    if (data.signals && Array.isArray(data.signals) && data.signals.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").text("Detected Signals");
      doc.fontSize(10).font("Helvetica");
      data.signals.forEach((signal: { level: string; name: string; description: string }) => {
        doc.text(`[${signal.level}] ${signal.name}`, { continued: false });
        doc.text(`  ${signal.description}`, { indent: 20 });
      });
      doc.moveDown();
    }

    // Notes section
    if (data.notes) {
      doc.fontSize(12).font("Helvetica-Bold").text("Notes");
      doc.fontSize(10).font("Helvetica");
      doc.text(data.notes);
      doc.moveDown();
    }

    // Footer
    doc.moveDown();
    doc.fontSize(9).text("TruthTrace AI © 2025 | Image Forensic Verification", { align: "center" });

    // End document and wait for completion
    doc.end();
    const pdfBuffer = await pdfPromise;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="truthtrace-report-${Date.now()}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("PDF route error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF report",
        details: errorMsg,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
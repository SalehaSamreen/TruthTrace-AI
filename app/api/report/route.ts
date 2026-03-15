import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    
    doc.text("TruthTrace AI Forensic Report", { align: "center" });
    doc.moveDown();

    doc.text(`Score: ${data.score}`);
    doc.text(`Verdict: ${data.verdict}`);
    doc.moveDown();

    doc.text("Analysis Notes:");
    doc.text(data.notes || "No additional notes.");

    doc.end();

    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=truthtrace-report.pdf",
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF report" }),
      { status: 500 }
    );
  }
}
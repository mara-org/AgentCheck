import { NextRequest, NextResponse } from "next/server";
import { getAuditBundle } from "@/features/audits/firestore";
import { renderReportPdf } from "@/features/reports/report-pdf";
import { verifyRequest } from "@/lib/server-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await verifyRequest(request);
    const { id } = await context.params;
    const bundle = await getAuditBundle(token.uid, id);
    const buffer = await renderReportPdf(bundle);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="agentcheck-${id}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to export report." },
      { status: 400 },
    );
  }
}

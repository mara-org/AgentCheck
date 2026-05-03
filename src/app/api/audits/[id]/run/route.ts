import { NextRequest, NextResponse } from "next/server";
import { runAudit } from "@/features/audits/firestore";
import { verifyRequest } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await verifyRequest(request);
    const { id } = await context.params;
    const bundle = await runAudit(token.uid, id);
    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run audit." },
      { status: 400 },
    );
  }
}

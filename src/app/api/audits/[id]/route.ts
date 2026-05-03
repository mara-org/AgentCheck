import { NextRequest, NextResponse } from "next/server";
import { getAuditBundle } from "@/features/audits/firestore";
import { verifyRequest } from "@/lib/server-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = await verifyRequest(request);
    const { id } = await context.params;
    return NextResponse.json(await getAuditBundle(token.uid, id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load audit." },
      { status: 404 },
    );
  }
}

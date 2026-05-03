import { NextRequest, NextResponse } from "next/server";
import { handlePolarWebhook } from "@/features/billing/polar";

export async function POST(request: NextRequest) {
  try {
    await handlePolarWebhook(await request.text(), request.headers);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed." },
      { status: 400 },
    );
  }
}

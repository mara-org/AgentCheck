import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutUrl } from "@/features/billing/polar";
import { verifyRequest } from "@/lib/server-auth";

const schema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
});

export async function POST(request: NextRequest) {
  try {
    const token = await verifyRequest(request);
    const { plan } = schema.parse(await request.json());
    return NextResponse.json(await createCheckoutUrl(token.uid, token.email, plan));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout." },
      { status: 400 },
    );
  }
}

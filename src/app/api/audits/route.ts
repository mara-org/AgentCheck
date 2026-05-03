import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAudit, listAudits } from "@/features/audits/firestore";
import { verifyRequest } from "@/lib/server-auth";

const auditSchema = z.object({
  companyName: z.string().min(2),
  companyWebsite: z.string().optional(),
  agentType: z.enum(["support", "sales", "booking", "internal"]),
  inputMethod: z.enum(["api_endpoint", "chat_widget_url", "manual_prompt"]),
  apiEndpoint: z.string().optional(),
  chatWidgetUrl: z.string().optional(),
  manualPrompt: z.string().optional(),
  knowledgeBaseText: z.string().optional(),
  selectedSuites: z.array(
    z.enum([
      "hallucination",
      "prompt_injection",
      "refund_abuse",
      "angry_customer",
      "privacy_leakage",
      "escalation_handling",
      "brand_tone",
    ]),
  ).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const token = await verifyRequest(request);
    return NextResponse.json({ audits: await listAudits(token.uid) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list audits." },
      { status: 401 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await verifyRequest(request);
    const payload = auditSchema.parse(await request.json());
    const audit = await createAudit(token.uid, token.email, payload);
    return NextResponse.json({ audit }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create audit." },
      { status: 400 },
    );
  }
}

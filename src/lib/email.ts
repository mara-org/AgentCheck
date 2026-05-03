import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY ?? process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM;
  if (!apiKey || !from) return null;
  resend ??= new Resend(apiKey);
  return resend;
}

export async function sendAuditEmail({
  to,
  subject,
  body,
}: {
  to?: string;
  subject: string;
  body: string;
}) {
  const client = getResend();
  if (!client || !to) return;

  await client.emails.send({
    from: (process.env.EMAIL_FROM ?? process.env.RESEND_FROM)!,
    to,
    subject,
    text: body,
  });
}

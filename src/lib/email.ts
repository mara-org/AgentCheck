import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
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
    from: process.env.RESEND_FROM!,
    to,
    subject,
    text: body,
  });
}

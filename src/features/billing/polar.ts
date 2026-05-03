import { validateEvent } from "@polar-sh/sdk/webhooks";
import { getActiveSubscription, getOrCreateTenant, upsertSubscription } from "@/features/audits/firestore";
import type { Subscription } from "@/lib/types";

const productEnv = {
  starter: "POLAR_STARTER_PRODUCT_ID",
  growth: "POLAR_GROWTH_PRODUCT_ID",
  pro: "POLAR_PRO_PRODUCT_ID",
} as const;

export type PaidPlan = keyof typeof productEnv;

export function getProductId(plan: PaidPlan) {
  const value = process.env[productEnv[plan]];
  if (!value) throw new Error(`${productEnv[plan]} is not configured.`);
  return value;
}

export async function createCheckoutUrl(uid: string, email: string | undefined, plan: PaidPlan) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is not configured.");

  const user = await getOrCreateTenant(uid, email);
  const existing = await getActiveSubscription(user.defaultOrgId);
  if (existing) return { alreadyActive: true, url: null };

  const response = await fetch("https://api.polar.sh/v1/checkouts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products: [getProductId(plan)],
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard?checkout=success`,
      metadata: {
        firebaseUid: uid,
        orgId: user.defaultOrgId,
        plan,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Polar checkout failed: ${body}`);
  }

  const checkout = (await response.json()) as { url?: string };
  if (!checkout.url) throw new Error("Polar did not return a checkout URL.");
  return { alreadyActive: false, url: checkout.url };
}

export async function handlePolarWebhook(body: string, headers: Headers) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) throw new Error("POLAR_WEBHOOK_SECRET is not configured.");

  const event = validateEvent(
    body,
    Object.fromEntries(headers.entries()),
    secret,
  ) as {
    type: string;
    data: {
      id?: string;
      product_id?: string;
      productId?: string;
      customer_id?: string;
      customerId?: string;
      subscription_id?: string;
      subscriptionId?: string;
      status?: Subscription["status"];
      current_period_end?: string;
      currentPeriodEnd?: string;
      metadata?: Record<string, string>;
      customer?: { id?: string };
    };
  };

  if (!["order.paid", "subscription.created", "subscription.updated"].includes(event.type)) {
    return;
  }

  const metadata = event.data.metadata ?? {};
  const orgId = metadata.orgId;
  const plan = (metadata.plan ?? "starter") as Subscription["plan"];
  if (!orgId) throw new Error("Polar webhook is missing orgId metadata.");

  await upsertSubscription({
    id: event.data.subscription_id ?? event.data.subscriptionId ?? event.data.id,
    orgId,
    polarCustomerId: event.data.customer_id ?? event.data.customerId ?? event.data.customer?.id,
    polarSubscriptionId: event.data.subscription_id ?? event.data.subscriptionId ?? event.data.id,
    plan,
    status: event.type === "order.paid" ? "active" : event.data.status ?? "active",
    currentPeriodEnd: event.data.current_period_end ?? event.data.currentPeriodEnd,
  });
}

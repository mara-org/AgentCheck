import { validateEvent } from "@polar-sh/sdk/webhooks";
import { getActiveSubscription, getOrCreateTenant, upsertSubscription } from "@/features/audits/firestore";
import type { Subscription } from "@/lib/types";

const productEnv = {
  starter: ["BILLING_STARTER_PRODUCT_ID", "POLAR_STARTER_PRODUCT_ID"],
  growth: ["BILLING_GROWTH_PRODUCT_ID", "POLAR_GROWTH_PRODUCT_ID"],
  pro: ["BILLING_PRO_PRODUCT_ID", "POLAR_PRO_PRODUCT_ID"],
} as const;

export type PaidPlan = keyof typeof productEnv;

export function getProductId(plan: PaidPlan) {
  const [primary, fallback] = productEnv[plan];
  const value = process.env[primary] ?? process.env[fallback];
  if (!value) throw new Error("Checkout is not available right now.");
  return value;
}

export async function createCheckoutUrl(uid: string, email: string | undefined, plan: PaidPlan) {
  const accessToken = process.env.BILLING_ACCESS_TOKEN ?? process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Checkout is not available right now.");

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
    throw new Error("Checkout is not available right now.");
  }

  const checkout = (await response.json()) as { url?: string };
  if (!checkout.url) throw new Error("Checkout is not available right now.");
  return { alreadyActive: false, url: checkout.url };
}

export async function handlePolarWebhook(body: string, headers: Headers) {
  const secret = process.env.BILLING_WEBHOOK_SECRET ?? process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) throw new Error("Webhook handling is not available right now.");

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
  if (!orgId) throw new Error("Webhook metadata is incomplete.");

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

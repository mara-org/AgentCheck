# AgentCheck

AgentCheck is a B2B SaaS MVP for testing and red-teaming customer support agents before launch. It simulates difficult customer conversations, policy edge cases, privacy-risk scenarios, escalation decisions, and brand-tone checks, then produces a scored report with transcripts and recommended fixes.

## Product Surface

- Premium public landing page
- Email/password authentication
- Protected dashboard
- Multi-step audit creation flow
- Billing-gated audit execution
- Scored report view with transcripts, risks, and fixes
- PDF report export
- Tenant-aware server APIs and datastore rules

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Configure the hosted auth/datastore project and add the public values:

```bash
NEXT_PUBLIC_AUTH_API_KEY=
NEXT_PUBLIC_AUTH_DOMAIN=
NEXT_PUBLIC_DATA_PROJECT_ID=
NEXT_PUBLIC_STORAGE_BUCKET=
NEXT_PUBLIC_MESSAGING_SENDER_ID=
NEXT_PUBLIC_APP_CLIENT_ID=
```

4. Configure server workspace access:

```bash
AUTH_SERVICE_ACCOUNT_BASE64=
```

or:

```bash
AUTH_PROJECT_ID=
AUTH_CLIENT_EMAIL=
AUTH_PRIVATE_KEY=
```

5. Configure billing, audit intelligence, and email delivery:

```bash
BILLING_ACCESS_TOKEN=
BILLING_WEBHOOK_SECRET=
BILLING_STARTER_PRODUCT_ID=
BILLING_GROWTH_PRODUCT_ID=
BILLING_PRO_PRODUCT_ID=
AI_PROVIDER_API_KEY=
AUDIT_MODEL=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=
```

6. Run locally:

```bash
npm run dev
```

## Datastore Rules

Deploy the datastore rules and indexes with the configured datastore CLI for the
workspace project.

All writes go through verified server API routes. Client rules allow authenticated organization members to read only their workspace data and deny direct client writes to audits, results, subscriptions, and organization records.

## Runtime Gates

Audit execution fails closed:

- The user must be authenticated.
- The organization must have an active plan.
- Server workspace access must be configured.
- The audit engine must be configured.

Draft audits can be created before billing is active, but runs are blocked until the workspace is ready.

## Deployment

Do not commit secrets. Add all env vars in the hosting dashboard or CLI. Mark
server credentials, billing tokens, audit intelligence keys, and email delivery
keys as sensitive.

Add public auth/datastore variables, billing product IDs, `AUDIT_MODEL`, and `EMAIL_FROM` as normal environment variables.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Notes

- The MVP implements manual prompt audits first. Endpoint and widget URL input methods are stored for the next external-agent integration phase.
- PDF/text upload extraction is represented in the product flow; pasted knowledge base and policy text are implemented now.

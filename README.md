# AgentCheck

AgentCheck is a B2B SaaS MVP for testing and red-teaming AI customer support agents before launch. It simulates difficult customers, prompt injection attempts, hallucination checks, refund policy scenarios, privacy-risk scenarios, escalation handling, and brand-tone checks, then produces a scored report with transcripts and prompt fixes.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Auth and Firestore
- Firebase Admin SDK for API authorization
- Polar for enforced subscriptions
- Resend for transactional emails
- OpenAI for audit generation and evaluation
- React PDF for report export
- Vitest for scoring tests

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create a Firebase project for AgentCheck, enable Email/Password auth, create Firestore, and add the Firebase web config to `.env.local`.

4. Create a Firebase service account and set either:

```bash
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 encoded service account json>
```

or:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

5. Configure Polar and OpenAI:

- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_STARTER_PRODUCT_ID`
- `POLAR_GROWTH_PRODUCT_ID`
- `POLAR_PRO_PRODUCT_ID`
- `OPENAI_API_KEY`

6. Configure Resend for report-ready and failure emails:

- `RESEND_API_KEY`
- `RESEND_FROM`

7. Run the app:

```bash
npm run dev
```

## Firebase Rules

Deploy Firestore rules and indexes with Firebase CLI:

```bash
firebase deploy --only firestore
```

All writes go through verified server API routes. Firestore client rules allow authenticated organization members to read only their tenant data and deny direct client writes to audits, results, subscriptions, and organization records.

## Billing Gate

Audit execution is intentionally fail-closed:

- The user must be authenticated.
- The organization must have an active Polar subscription in Firestore.
- Firebase Admin credentials must be configured.
- `OPENAI_API_KEY` must be configured.

Draft audits can be created before billing is active, but runs are blocked until subscription and AI configuration are ready.

## Vercel Deployment

Do not commit secrets. Add all env vars in Vercel:

```bash
vercel link --yes --project agentcheck
vercel env add RESEND_API_KEY production preview development --sensitive
vercel env add OPENAI_API_KEY production preview development --sensitive
vercel env add FIREBASE_SERVICE_ACCOUNT_BASE64 production preview development --sensitive
vercel env add POLAR_ACCESS_TOKEN production preview development --sensitive
vercel env add POLAR_WEBHOOK_SECRET production preview development --sensitive
```

Add the public Firebase variables and Polar product IDs as normal Vercel env vars.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Notes

- The MVP implements manual prompt demo audits. API endpoint and chat widget URL input methods are stored for the next external-agent integration phase.
- PDF/text upload extraction is represented in the product flow; pasted knowledge base and policy text are implemented now.
- The current backend target is Firebase Auth and Firestore.

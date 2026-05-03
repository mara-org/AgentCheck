import {
  FieldValue,
  Timestamp,
  getAdminDb,
} from "@/lib/firebase/admin";
import type {
  AppUser,
  Audit,
  AuditBundle,
  AuditResult,
  AuditTestCase,
  AuditMessage,
  Organization,
  Subscription,
} from "@/lib/types";
import { slugify } from "@/lib/utils";
import { sendAuditEmail } from "@/lib/email";
import { runDemoAudit } from "./engine";

const COLLECTIONS = {
  users: "users",
  organizations: "organizations",
  members: "organization_members",
  audits: "audits",
  testCases: "audit_test_cases",
  messages: "audit_messages",
  results: "audit_results",
  subscriptions: "subscriptions",
};

function iso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function serialize<T extends Record<string, unknown>>(id: string, data: T) {
  return Object.fromEntries(
    Object.entries({ id, ...data }).map(([key, value]) => [key, value instanceof Timestamp ? iso(value) : value]),
  );
}

export async function getOrCreateTenant(uid: string, email?: string, name?: string) {
  const db = getAdminDb();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);
  const existing = await userRef.get();

  if (existing.exists) {
    return serialize(existing.id, existing.data() ?? {}) as unknown as AppUser;
  }

  const orgRef = db.collection(COLLECTIONS.organizations).doc();
  const orgName = email ? `${email.split("@")[0]}'s organization` : "AgentCheck organization";
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.set(orgRef, {
      name: orgName,
      slug: `${slugify(orgName)}-${orgRef.id.slice(0, 6)}`,
      ownerId: uid,
      createdAt: now,
      updatedAt: now,
    });
    transaction.set(userRef, {
      email: email ?? "",
      name: name ?? "",
      defaultOrgId: orgRef.id,
      createdAt: now,
      updatedAt: now,
    });
    transaction.set(db.collection(COLLECTIONS.members).doc(`${orgRef.id}_${uid}`), {
      orgId: orgRef.id,
      userId: uid,
      role: "owner",
      createdAt: now,
    });
  });

  const created = await userRef.get();
  return serialize(created.id, created.data() ?? {}) as unknown as AppUser;
}

export async function assertOrgAccess(uid: string, orgId: string) {
  const db = getAdminDb();
  const member = await db.collection(COLLECTIONS.members).doc(`${orgId}_${uid}`).get();
  if (!member.exists) throw new Error("You do not have access to this organization.");
}

export async function getOrganization(orgId: string) {
  const snapshot = await getAdminDb().collection(COLLECTIONS.organizations).doc(orgId).get();
  if (!snapshot.exists) return null;
  return serialize(snapshot.id, snapshot.data() ?? {}) as unknown as Organization;
}

export async function listAudits(uid: string) {
  const user = await getOrCreateTenant(uid);
  await assertOrgAccess(uid, user.defaultOrgId);
  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.audits)
    .where("orgId", "==", user.defaultOrgId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => serialize(doc.id, doc.data())) as unknown as Audit[];
}

export async function createAudit(uid: string, email: string | undefined, payload: Omit<Audit, "id" | "orgId" | "ownerId" | "status" | "createdAt" | "updatedAt">) {
  const user = await getOrCreateTenant(uid, email);
  await assertOrgAccess(uid, user.defaultOrgId);

  const db = getAdminDb();
  const auditRef = db.collection(COLLECTIONS.audits).doc();
  const now = FieldValue.serverTimestamp();
  await auditRef.set({
    ...payload,
    orgId: user.defaultOrgId,
    ownerId: uid,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  const created = await auditRef.get();
  return serialize(created.id, created.data() ?? {}) as unknown as Audit;
}

export async function getAuditBundle(uid: string, auditId: string): Promise<AuditBundle> {
  const db = getAdminDb();
  const auditSnapshot = await db.collection(COLLECTIONS.audits).doc(auditId).get();
  if (!auditSnapshot.exists) throw new Error("Audit not found.");

  const audit = serialize(auditSnapshot.id, auditSnapshot.data() ?? {}) as unknown as Audit;
  await assertOrgAccess(uid, audit.orgId);

  const [testCaseSnapshot, messageSnapshot, resultSnapshot] = await Promise.all([
    db.collection(COLLECTIONS.testCases).where("auditId", "==", auditId).get(),
    db.collection(COLLECTIONS.messages).where("auditId", "==", auditId).orderBy("turn", "asc").get(),
    db.collection(COLLECTIONS.results).where("auditId", "==", auditId).limit(1).get(),
  ]);

  return {
    audit,
    testCases: testCaseSnapshot.docs.map((doc) => serialize(doc.id, doc.data())) as unknown as AuditTestCase[],
    messages: messageSnapshot.docs.map((doc) => serialize(doc.id, doc.data())) as unknown as AuditMessage[],
    result: resultSnapshot.docs[0]
      ? (serialize(resultSnapshot.docs[0].id, resultSnapshot.docs[0].data()) as unknown as AuditResult)
      : undefined,
  };
}

export async function getActiveSubscription(orgId: string) {
  const snapshot = await getAdminDb()
    .collection(COLLECTIONS.subscriptions)
    .where("orgId", "==", orgId)
    .where("status", "in", ["active", "trialing"])
    .limit(1)
    .get();

  if (!snapshot.docs[0]) return null;
  return serialize(snapshot.docs[0].id, snapshot.docs[0].data()) as unknown as Subscription;
}

export async function requireBillableOrg(orgId: string) {
  const subscription = await getActiveSubscription(orgId);
  if (!subscription) {
    throw new Error("An active Polar subscription is required before running audits.");
  }
  return subscription;
}

export async function runAudit(uid: string, auditId: string) {
  const db = getAdminDb();
  const auditRef = db.collection(COLLECTIONS.audits).doc(auditId);
  const auditSnapshot = await auditRef.get();
  if (!auditSnapshot.exists) throw new Error("Audit not found.");

  const audit = serialize(auditSnapshot.id, auditSnapshot.data() ?? {}) as unknown as Audit;
  await assertOrgAccess(uid, audit.orgId);
  await requireBillableOrg(audit.orgId);

  await auditRef.update({
    status: "running",
    failureReason: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    const output = await runDemoAudit(audit);
    const batch = db.batch();

    output.testCases.forEach((testCase) => {
      batch.set(db.collection(COLLECTIONS.testCases).doc(testCase.id), testCase);
    });
    output.messages.forEach((message) => {
      batch.set(db.collection(COLLECTIONS.messages).doc(message.id), message);
    });
    batch.set(db.collection(COLLECTIONS.results).doc(output.result.id), output.result);
    batch.update(auditRef, {
      status: "completed",
      finalScore: output.result.overallScore,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    const user = await getAdminDb().collection(COLLECTIONS.users).doc(uid).get();
    await sendAuditEmail({
      to: user.get("email"),
      subject: `AgentCheck report ready: ${audit.companyName}`,
      body: `Your AgentCheck audit for ${audit.companyName} is complete with a score of ${output.result.overallScore}/100.`,
    });
    return getAuditBundle(uid, auditId);
  } catch (error) {
    await auditRef.update({
      status: "failed",
      failureReason: error instanceof Error ? error.message : "Audit failed.",
      updatedAt: FieldValue.serverTimestamp(),
    });
    const user = await getAdminDb().collection(COLLECTIONS.users).doc(uid).get();
    await sendAuditEmail({
      to: user.get("email"),
      subject: `AgentCheck audit failed: ${audit.companyName}`,
      body: error instanceof Error ? error.message : "Audit failed.",
    });
    throw error;
  }
}

export async function upsertSubscription(subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const db = getAdminDb();
  const id = subscription.id ?? subscription.polarSubscriptionId ?? `${subscription.orgId}_${subscription.plan}`;
  const ref = db.collection(COLLECTIONS.subscriptions).doc(id);
  const existing = await ref.get();
  await ref.set(
    {
      ...subscription,
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

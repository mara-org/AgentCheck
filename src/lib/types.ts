export type AuditStatus = "draft" | "running" | "completed" | "failed";

export type AgentType = "support" | "sales" | "booking" | "internal";

export type InputMethod = "api_endpoint" | "chat_widget_url" | "manual_prompt";

export type TestSuite =
  | "hallucination"
  | "prompt_injection"
  | "refund_abuse"
  | "angry_customer"
  | "privacy_leakage"
  | "escalation_handling"
  | "brand_tone";

export type MessageRole = "system" | "customer" | "agent" | "evaluator";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  defaultOrgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Audit {
  id: string;
  orgId: string;
  ownerId: string;
  companyName: string;
  companyWebsite?: string;
  agentType: AgentType;
  inputMethod: InputMethod;
  apiEndpoint?: string;
  chatWidgetUrl?: string;
  manualPrompt?: string;
  knowledgeBaseText?: string;
  selectedSuites: TestSuite[];
  status: AuditStatus;
  finalScore?: number;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AuditTestCase {
  id: string;
  auditId: string;
  orgId: string;
  suite: TestSuite;
  persona: string;
  objective: string;
  expectedBehavior: string;
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  passed: boolean;
  createdAt: string;
}

export interface AuditMessage {
  id: string;
  auditId: string;
  testCaseId: string;
  orgId: string;
  role: MessageRole;
  content: string;
  turn: number;
  createdAt: string;
}

export interface AuditResult {
  id: string;
  auditId: string;
  orgId: string;
  overallScore: number;
  riskCategories: Record<TestSuite, number>;
  failedTestCaseIds: string[];
  recommendations: string[];
  promptFixes: string[];
  createdAt: string;
}

export interface Subscription {
  id: string;
  orgId: string;
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  plan: "starter" | "growth" | "pro" | "enterprise";
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditBundle {
  audit: Audit;
  testCases: AuditTestCase[];
  messages: AuditMessage[];
  result?: AuditResult;
}

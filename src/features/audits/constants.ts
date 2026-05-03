import type { AgentType, InputMethod, TestSuite } from "@/lib/types";

export const agentTypes: { value: AgentType; label: string }[] = [
  { value: "support", label: "Support" },
  { value: "sales", label: "Sales" },
  { value: "booking", label: "Booking" },
  { value: "internal", label: "Internal assistant" },
];

export const inputMethods: { value: InputMethod; label: string; description: string }[] = [
  {
    value: "manual_prompt",
    label: "Manual prompt paste",
    description: "Demo mode: paste the system prompt or instructions you give your agent.",
  },
  {
    value: "api_endpoint",
    label: "API endpoint",
    description: "Store endpoint details now; live external calls can be enabled later.",
  },
  {
    value: "chat_widget_url",
    label: "Chat widget URL",
    description: "Store a web widget URL for future Playwright-driven chatbot testing.",
  },
];

export const testSuites: { value: TestSuite; label: string; description: string }[] = [
  {
    value: "hallucination",
    label: "Hallucination",
    description: "Checks whether the agent invents unsupported facts.",
  },
  {
    value: "prompt_injection",
    label: "Prompt injection",
    description: "Attempts to override instructions or reveal hidden policy.",
  },
  {
    value: "refund_abuse",
    label: "Refund abuse",
    description: "Pushes refund policy boundaries and exception handling.",
  },
  {
    value: "angry_customer",
    label: "Angry customer",
    description: "Tests empathy, de-escalation, and clarity under pressure.",
  },
  {
    value: "privacy_leakage",
    label: "Privacy leakage",
    description: "Looks for unsafe handling of personal or account data.",
  },
  {
    value: "escalation_handling",
    label: "Escalation handling",
    description: "Verifies the agent knows when to hand off.",
  },
  {
    value: "brand_tone",
    label: "Brand tone",
    description: "Measures consistency with the desired support voice.",
  },
];

export const suiteLabels = Object.fromEntries(
  testSuites.map((suite) => [suite.value, suite.label]),
) as Record<TestSuite, string>;

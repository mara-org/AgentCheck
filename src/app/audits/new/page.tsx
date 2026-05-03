"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Input, Label, Textarea } from "@/components/input";
import { agentTypes, inputMethods, testSuites } from "@/features/audits/constants";
import { authHeader, useAuth } from "@/features/auth/auth-provider";
import { Protected } from "@/features/auth/protected";
import type { AgentType, InputMethod, TestSuite } from "@/lib/types";
import { cn } from "@/lib/utils";

const steps = [
  "Company",
  "Agent",
  "Input",
  "Knowledge",
  "Suites",
  "Run",
];

export default function NewAuditPage() {
  return (
    <Protected>
      <AppShell>
        <NewAuditContent />
      </AppShell>
    </Protected>
  );
}

function NewAuditContent() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [agentType, setAgentType] = useState<AgentType>("support");
  const [inputMethod, setInputMethod] = useState<InputMethod>("manual_prompt");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [chatWidgetUrl, setChatWidgetUrl] = useState("");
  const [manualPrompt, setManualPrompt] = useState("");
  const [knowledgeBaseText, setKnowledgeBaseText] = useState("");
  const [selectedSuites, setSelectedSuites] = useState<TestSuite[]>([
    "hallucination",
    "prompt_injection",
    "privacy_leakage",
    "brand_tone",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinue = useMemo(() => {
    if (step === 0) return companyName.trim().length > 1;
    if (step === 2 && inputMethod === "manual_prompt") return manualPrompt.trim().length > 20;
    if (step === 2 && inputMethod === "api_endpoint") return apiEndpoint.trim().length > 0;
    if (step === 2 && inputMethod === "chat_widget_url") return chatWidgetUrl.trim().length > 0;
    if (step === 4) return selectedSuites.length > 0;
    return true;
  }, [apiEndpoint, chatWidgetUrl, companyName, inputMethod, manualPrompt, selectedSuites.length, step]);

  function toggleSuite(value: TestSuite) {
    setSelectedSuites((current) =>
      current.includes(value)
        ? current.filter((suite) => suite !== value)
        : [...current, value],
    );
  }

  async function createAndRun() {
    setLoading(true);
    setError("");
    try {
      const headers = {
        ...(await authHeader(getToken)),
        "Content-Type": "application/json",
      };
      const createResponse = await fetch("/api/audits", {
        method: "POST",
        headers,
        body: JSON.stringify({
          companyName,
          companyWebsite,
          agentType,
          inputMethod,
          apiEndpoint,
          chatWidgetUrl,
          manualPrompt,
          knowledgeBaseText,
          selectedSuites,
        }),
      });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created.error ?? "Unable to create audit.");

      const runResponse = await fetch(`/api/audits/${created.audit.id}/run`, {
        method: "POST",
        headers,
      });
      const runBody = await runResponse.json();
      if (!runResponse.ok) {
        router.push(`/audits/${created.audit.id}`);
        throw new Error(runBody.error ?? "Audit created but could not run.");
      }

      router.push(`/audits/${created.audit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run audit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ButtonLink href="/dashboard" variant="ghost" className="mb-6">
        <ArrowLeft size={16} />
        Dashboard
      </ButtonLink>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <h1 className="text-2xl font-semibold">New audit</h1>
          <div className="mt-6 grid gap-2 sm:grid-cols-6">
            {steps.map((label, index) => (
              <div
                key={label}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-semibold",
                  index === step
                    ? "bg-blue-600 text-white"
                    : index < step
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500",
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[460px] p-6">
          {step === 0 ? (
            <div className="grid gap-5">
              <div>
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Company website</Label>
                <Input id="companyWebsite" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} placeholder="https://example.com" />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {agentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAgentType(type.value)}
                  className={cn(
                    "rounded-lg border p-5 text-left transition",
                    agentType === type.value ? "border-blue-500 bg-blue-50" : "border-slate-200",
                  )}
                >
                  <div className="font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5">
              <div className="grid gap-3">
                {inputMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setInputMethod(method.value)}
                    className={cn(
                      "rounded-lg border p-5 text-left transition",
                      inputMethod === method.value ? "border-blue-500 bg-blue-50" : "border-slate-200",
                    )}
                  >
                    <div className="font-semibold">{method.label}</div>
                    <p className="mt-1 text-sm text-slate-600">{method.description}</p>
                  </button>
                ))}
              </div>
              {inputMethod === "manual_prompt" ? (
                <div>
                  <Label htmlFor="manualPrompt">Agent prompt</Label>
                  <Textarea id="manualPrompt" value={manualPrompt} onChange={(event) => setManualPrompt(event.target.value)} className="min-h-48" />
                </div>
              ) : null}
              {inputMethod === "api_endpoint" ? (
                <div>
                  <Label htmlFor="apiEndpoint">API endpoint</Label>
                  <Input id="apiEndpoint" value={apiEndpoint} onChange={(event) => setApiEndpoint(event.target.value)} />
                </div>
              ) : null}
              {inputMethod === "chat_widget_url" ? (
                <div>
                  <Label htmlFor="chatWidgetUrl">Chat widget URL</Label>
                  <Input id="chatWidgetUrl" value={chatWidgetUrl} onChange={(event) => setChatWidgetUrl(event.target.value)} />
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <Label htmlFor="knowledgeBase">Knowledge base or policy text</Label>
              <Textarea
                id="knowledgeBase"
                value={knowledgeBaseText}
                onChange={(event) => setKnowledgeBaseText(event.target.value)}
                className="min-h-80"
                placeholder="Paste refund policy, privacy rules, escalation policy, support tone guidance, or product facts."
              />
              <p className="mt-2 text-sm text-slate-500">
                PDF upload extraction is prepared as a product requirement; paste text is implemented in this MVP.
              </p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {testSuites.map((suite) => (
                <button
                  key={suite.value}
                  onClick={() => toggleSuite(suite.value)}
                  className={cn(
                    "flex gap-3 rounded-lg border p-4 text-left transition",
                    selectedSuites.includes(suite.value) ? "border-blue-500 bg-blue-50" : "border-slate-200",
                  )}
                >
                  <span className={cn("mt-0.5 grid h-5 w-5 place-items-center rounded border", selectedSuites.includes(suite.value) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300")}>
                    {selectedSuites.includes(suite.value) ? <Check size={14} /> : null}
                  </span>
                  <span>
                    <span className="block font-semibold">{suite.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{suite.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold">Review</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="font-semibold text-slate-500">Company</dt><dd>{companyName}</dd></div>
                  <div><dt className="font-semibold text-slate-500">Agent type</dt><dd>{agentType}</dd></div>
                  <div><dt className="font-semibold text-slate-500">Input</dt><dd>{inputMethod}</dd></div>
                  <div><dt className="font-semibold text-slate-500">Suites</dt><dd>{selectedSuites.length}</dd></div>
                </dl>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Audit runs require an active workspace plan and completed secure workspace setup.
                If setup is incomplete, your draft will be saved and the run can be started later.
              </div>
              {error ? (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 p-6">
          <Button variant="secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || loading}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((value) => value + 1)} disabled={!canContinue}>
              Continue
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={createAndRun} disabled={loading || !canContinue}>
              <Play size={16} />
              {loading ? "Running..." : "Run audit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

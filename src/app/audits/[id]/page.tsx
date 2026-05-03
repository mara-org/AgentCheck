"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Download, MessageSquareText, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { ScoreRing } from "@/components/score-ring";
import { StatusBadge } from "@/components/status-badge";
import { suiteLabels } from "@/features/audits/constants";
import { authHeader, useAuth } from "@/features/auth/auth-provider";
import { Protected } from "@/features/auth/protected";
import type { AuditBundle } from "@/lib/types";

export default function AuditPage() {
  return (
    <Protected>
      <AppShell>
        <AuditContent />
      </AppShell>
    </Protected>
  );
}

function AuditContent() {
  const params = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [bundle, setBundle] = useState<AuditBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const headers = await authHeader(getToken);
    const response = await fetch(`/api/audits/${params.id}`, { headers });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load audit.");
    setBundle(body);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers = await authHeader(getToken);
        const response = await fetch(`/api/audits/${params.id}`, { headers });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load audit.");
        if (mounted) setBundle(body);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load audit.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function run() {
    setRunning(true);
    setError("");
    try {
      const headers = await authHeader(getToken);
      const response = await fetch(`/api/audits/${params.id}/run`, {
        method: "POST",
        headers,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to run audit.");
      setBundle(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run audit.");
      await load().catch(() => undefined);
    } finally {
      setRunning(false);
    }
  }

  async function exportPdf() {
    const headers = await authHeader(getToken);
    const response = await fetch(`/api/reports/${params.id}/pdf`, { headers });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `agentcheck-${params.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const messagesByCase = useMemo(() => {
    const map = new Map<string, NonNullable<AuditBundle["messages"]>>();
    bundle?.messages.forEach((message) => {
      map.set(message.testCaseId, [...(map.get(message.testCaseId) ?? []), message]);
    });
    return map;
  }, [bundle?.messages]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="h-52 animate-pulse rounded-md bg-slate-100" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Audit not found."}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <ButtonLink href="/dashboard" variant="ghost">
          <ArrowLeft size={16} />
          Dashboard
        </ButtonLink>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportPdf} disabled={!bundle.result}>
            <Download size={16} />
            Export PDF
          </Button>
          {bundle.audit.status !== "completed" ? (
            <Button onClick={run} disabled={running}>
              <Play size={16} />
              {running ? "Running..." : "Run audit"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={18} />
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={bundle.audit.status} />
          </div>
          <div className="mt-8 flex justify-center">
            <ScoreRing score={bundle.result?.overallScore ?? bundle.audit.finalScore ?? 0} />
          </div>
          <h1 className="mt-8 text-2xl font-semibold">{bundle.audit.companyName}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {bundle.audit.agentType} agent · {bundle.audit.selectedSuites.length} test suites
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Risk categories</h2>
          {bundle.result ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(bundle.result.riskCategories).map(([suite, risk]) => (
                <div key={suite} className="rounded-lg border border-slate-200 p-4">
                  <div className="text-sm font-semibold">{suiteLabels[suite as keyof typeof suiteLabels]}</div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, risk)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{risk}% risk</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Run the audit to generate risk categories, transcripts, and prompt fixes.
            </p>
          )}
        </div>
      </section>

      {bundle.result ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Suggested prompt fixes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {bundle.result.promptFixes.map((fix) => (
              <div key={fix} className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6">
                {fix}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold">Conversation transcripts</h2>
        </div>
        {bundle.testCases.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquareText className="mx-auto text-slate-400" size={36} />
            <h3 className="mt-4 text-lg font-semibold">No transcripts yet</h3>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {bundle.testCases.map((testCase) => (
              <div key={testCase.id} className="p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <div className="font-semibold">{suiteLabels[testCase.suite]}</div>
                    <p className="mt-1 text-sm text-slate-600">{testCase.objective}</p>
                  </div>
                  <div className="text-sm font-semibold">Score {testCase.score}/100</div>
                </div>
                <div className="mt-4 grid gap-3">
                  {(messagesByCase.get(testCase.id) ?? []).map((message) => (
                    <div key={message.id} className="rounded-md bg-slate-50 p-4 text-sm leading-6">
                      <span className="font-semibold capitalize text-slate-500">{message.role}: </span>
                      {message.content}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

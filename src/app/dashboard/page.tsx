"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, FilePlus2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { ScoreRing } from "@/components/score-ring";
import { StatusBadge } from "@/components/status-badge";
import { Protected } from "@/features/auth/protected";
import { authHeader, useAuth } from "@/features/auth/auth-provider";
import type { Audit } from "@/lib/types";

export default function DashboardPage() {
  return (
    <Protected>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </Protected>
  );
}

function DashboardContent() {
  const { getToken } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    authHeader(getToken)
      .then((headers) => fetch("/api/audits", { headers }))
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load audits.");
        if (mounted) setAudits(body.audits);
      })
      .catch((err) => mounted && setError(err instanceof Error ? err.message : "Unable to load audits."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [getToken]);

  const completed = audits.filter((audit) => audit.status === "completed");
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum, audit) => sum + (audit.finalScore ?? 0), 0) / completed.length)
      : 0;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create audits, monitor status, and review completed QA reports.
          </p>
        </div>
        <ButtonLink href="/audits/new">
          <FilePlus2 size={16} />
          Create new audit
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-500">Completed audits</div>
          <div className="mt-3 text-4xl font-semibold">{completed.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-500">Average score</div>
          <div className="mt-3 flex items-center gap-4">
            <ScoreRing score={avgScore} size="sm" />
            <span className="text-sm text-slate-600">Across completed reports</span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-500">Billing gate</div>
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-700">
            <ShieldCheck size={18} className="text-blue-600" />
            Runs require an active Polar subscription.
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Previous audits</h2>
        </div>
        {loading ? (
          <div className="p-5">
            <div className="h-20 animate-pulse rounded-md bg-slate-100" />
          </div>
        ) : error ? (
          <div className="m-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={18} />
            {error}
          </div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center">
            <FilePlus2 className="mx-auto text-slate-400" size={36} />
            <h3 className="mt-4 text-lg font-semibold">No audits yet</h3>
            <p className="mt-2 text-sm text-slate-600">
              Start by pasting your agent prompt and selecting risk suites.
            </p>
            <ButtonLink href="/audits/new" className="mt-6">
              Create first audit
            </ButtonLink>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {audits.map((audit) => (
              <Link
                key={audit.id}
                href={`/audits/${audit.id}`}
                className="grid gap-4 p-5 transition hover:bg-slate-50 md:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <div className="font-semibold">{audit.companyName}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {audit.agentType} agent · {audit.selectedSuites.length} suites
                  </div>
                </div>
                <StatusBadge status={audit.status} />
                <div className="flex items-center gap-3 text-sm font-semibold">
                  {audit.finalScore ? `${audit.finalScore}/100` : "Open"}
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/login");
  }, [loading, configured, user, router]);

  if (!configured) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Workspace setup is incomplete</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The secure sign-in service is not ready yet. Please try again after
          the workspace has been configured.
        </p>
        <Link className="mt-6 text-sm font-semibold text-blue-700" href="/">
          Back to site
        </Link>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}

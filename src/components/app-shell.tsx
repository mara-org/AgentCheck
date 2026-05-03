"use client";

import Link from "next/link";
import { ShieldCheck, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { Button, ButtonLink } from "./button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-2 text-sm font-bold" href="/dashboard">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
              <ShieldCheck size={18} />
            </span>
            AgentCheck
          </Link>
          <nav className="flex items-center gap-2">
            <ButtonLink href="/audits/new" className="hidden sm:inline-flex">
              <Plus size={16} />
              New audit
            </ButtonLink>
            <span className="hidden max-w-[220px] truncate text-sm text-slate-500 md:block">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={() => logout()} aria-label="Sign out">
              <LogOut size={16} />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

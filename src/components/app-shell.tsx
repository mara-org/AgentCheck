"use client";

import { LogOut, Plus } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { Button, ButtonLink } from "./button";
import { Logo } from "./logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo href="/dashboard" />
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

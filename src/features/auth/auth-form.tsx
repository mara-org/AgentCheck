"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import { Input, Label } from "@/components/input";
import { useAuth } from "./auth-provider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { signIn, signUp, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_0.85fr]">
      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-500">
            <ShieldCheck size={18} />
          </span>
          AgentCheck
        </Link>
        <div>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            Launch AI support with a scored evidence trail.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300">
            Simulate adversarial customers, evaluate policy adherence, and export
            a report your support, legal, and product teams can review.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 text-sm font-bold lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-950 text-white">
              <ShieldCheck size={18} />
            </span>
            AgentCheck
          </Link>
          <h2 className="text-2xl font-semibold">
            {mode === "login" ? "Log in" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "login"
              ? "Continue to your audit dashboard."
              : "Start with a secure Firebase account."}
          </p>

          {!configured ? (
            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              Firebase public env vars are not configured. Add them in Vercel and local
              development before signing in.
            </div>
          ) : null}

          <div className="mt-6">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <Button className="mt-6 w-full" disabled={loading || !configured}>
            {loading ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
          </Button>
          <p className="mt-5 text-center text-sm text-slate-600">
            {mode === "login" ? "No account?" : "Already have an account?"}{" "}
            <Link className="font-semibold text-blue-700" href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Sign up" : "Log in"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

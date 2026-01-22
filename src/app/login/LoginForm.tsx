"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { loginAction } from "./actions";

export default function LoginForm({ siteKey }: { siteKey: string | null }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/admin";
  
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/de" className="inline-block">
            <h1 className="text-3xl font-bold gradient-text">Apfel Park</h1>
          </Link>
          <p className="mt-2 text-muted">Admin Login</p>
        </div>

        {/* Login Card */}
        <div className="tech-card rounded-2xl p-8">
          <form action={action} className="space-y-6">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            
            {state?.error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                {state.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                placeholder="admin@apfel-park.de"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                placeholder="••••••••"
              />
            </div>

            {/* Turnstile Captcha */}
            {siteKey ? (
               <div className="flex justify-center overflow-hidden">
                <Turnstile 
                  siteKey={siteKey} 
                  options={{ theme: 'dark' }}
                />
              </div>
            ) : (
              <p className="text-xs text-yellow-500 text-center">
                Security check disabled (Site Key not configured)
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l3-3m3 3H9" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/de"
            className="text-sm text-muted hover:text-gold transition"
          >
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}

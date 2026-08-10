import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { readSessionUser } from "@/lib/session";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function LoginPage() {
  const user = await readSessionUser();
  if (user) {
    redirect("/admin");
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

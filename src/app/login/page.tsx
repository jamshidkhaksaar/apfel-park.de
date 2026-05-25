import { Suspense } from "react";
import { redirect } from "next/navigation";

import { readSessionUser } from "@/lib/session";

import LoginForm from "./LoginForm";

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

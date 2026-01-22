import { Suspense } from "react";
import { getTurnstileSiteKey } from "@/lib/turnstile";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const siteKey = await getTurnstileSiteKey();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm siteKey={siteKey} />
    </Suspense>
  );
}

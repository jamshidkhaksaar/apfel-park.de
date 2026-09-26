"use client";

import { useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * The product filters used to require pressing "Anwenden" after every change.
 * Selecting a dropdown now applies immediately; the text field still waits for
 * Enter or the button, so typing does not fire a request per keystroke.
 */
export default function AdminFilterForm({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: ReactNode;
}) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={form}
      action={action}
      className={className}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        for (const [key, value] of new FormData(event.currentTarget)) {
          if (typeof value === "string" && value.trim()) params.set(key, value.trim());
        }
        startTransition(() => router.push(`${action}?${params}`));
      }}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) form.current?.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}

"use client";

import { useRef, type ReactNode } from "react";

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

  return (
    <form
      ref={form}
      action={action}
      className={className}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) form.current?.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}

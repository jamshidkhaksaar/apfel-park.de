"use client";

import { useState } from "react";

type Address = {
  street: string;
  city: string;
  postalCode: string;
};

export default function CopyAddressButton({
  address,
  label = "Copy address",
}: {
  address: Address;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullAddress = `${address.street}, ${address.postalCode} ${address.city}`;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative text-left text-sm text-muted transition hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      aria-label={label}
      title={label}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p>{address.street}</p>
          <p>
            {address.postalCode} {address.city}
          </p>
        </div>
        <div className="relative mt-0.5 h-4 w-4 shrink-0 text-gold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {copied ? (
            <svg
              className="absolute inset-0 h-4 w-4 animate-in fade-in zoom-in duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="absolute inset-0 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Feedback Tooltip */}
      <div
        role="status"
        aria-live="polite"
        className={`absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-surface-strong px-2 py-1 text-xs font-medium text-gold shadow-lg ring-1 ring-white/10 transition-all duration-200 ${
          copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        Copied!
      </div>
    </button>
  );
}

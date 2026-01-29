"use client";

import { useEffect } from "react";

/**
 * Error boundary component that handles chunk load errors
 * by triggering a page reload to fetch fresh chunks
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Check if this is a chunk load error
    if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Failed to fetch dynamically imported module")
    ) {
      // Clear any cached data and reload
      console.log("[GlobalError] Chunk load error detected, reloading page...");
      
      // Clear cache if available
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }
      
      // Hard reload to get fresh chunks
      window.location.reload();
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted mb-6">
              We encountered an error loading this page. This might be due to a recent update.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
              <button
                onClick={() => reset()}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

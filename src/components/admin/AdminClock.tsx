"use client";

import { useEffect, useState } from "react";

/**
 * ⚡ Bolt: AdminClock is isolated to its own component to prevent the high-frequency
 * setInterval (every 1s) from triggering a full re-render of the parent AdminShell
 * and all its children.
 */
export default function AdminClock() {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-[10px] tabular-nums text-muted/50">{clock}</span>;
}

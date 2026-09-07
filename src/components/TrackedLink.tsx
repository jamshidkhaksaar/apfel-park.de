"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { safelyTrack, trackedLinkEvents } from "@/lib/lead-analytics";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  title?: string;
  ariaLabel?: string;
  eventName: string;
  eventPayload?: Record<string, unknown>;
  eventId?: string;
};

const isInternalHref = (href: string) => href.startsWith("/");

export default function TrackedLink({
  href,
  children,
  className,
  target,
  rel,
  title,
  ariaLabel,
  eventName,
  eventPayload,
  eventId,
}: Props) {
  const handleClick = () => {
    for (const event of trackedLinkEvents(href, eventName, eventPayload)) {
      safelyTrack(event.name, event.payload, (name, payload) => window.apfelTrack?.(name, payload, eventId));
    }
  };

  const commonProps = {
    className,
    target,
    rel,
    title,
    "aria-label": ariaLabel,
    onClick: handleClick,
  };

  if (isInternalHref(href)) {
    return (
      <Link href={href} {...commonProps}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...commonProps}>
      {children}
    </a>
  );
}

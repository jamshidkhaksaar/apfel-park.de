"use client";

import Link from "next/link";
import type { ReactNode } from "react";

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
    window.apfelTrack?.(eventName, eventPayload ?? {}, eventId);
    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      window.apfelTrack?.("contact_click", {
        type: href.startsWith("tel:") ? "phone" : "email",
        href,
        ...(eventPayload ?? {}),
      });
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

"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import TrackedLink from "./TrackedLink";

type SafeEmailLinkProps = {
  email: string;
  className?: string;
  children?: ReactNode;
  eventName?: string;
  eventPayload?: Record<string, string>;
};

const subscribe = () => () => undefined;

const readableFallback = (email: string) =>
  email.replace("@", " [at] ").replaceAll(".", " [dot] ");

export default function SafeEmailLink({
  email,
  className,
  children,
  eventName,
  eventPayload,
}: SafeEmailLinkProps) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const content = (
    <>
      {children}
      <span>{isClient ? email : readableFallback(email)}</span>
    </>
  );

  if (!isClient) {
    return <span className={className}>{content}</span>;
  }

  if (eventName) {
    return (
      <TrackedLink
        href={`mailto:${email}`}
        className={className}
        eventName={eventName}
        eventPayload={eventPayload}
      >
        {content}
      </TrackedLink>
    );
  }

  return (
    <a href={`mailto:${email}`} className={className}>
      {content}
    </a>
  );
}

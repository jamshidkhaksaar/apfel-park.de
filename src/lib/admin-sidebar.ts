"use client";

import { useSyncExternalStore } from "react";

const key = 'apfel-admin-sidebar-collapsed';
const changeEvent = 'apfel-admin-sidebar-change';
let fallback = false;

const snapshot = () => {
  try { return window.localStorage.getItem(key) === 'true'; }
  catch { return fallback; }
};
const subscribe = (notify: () => void) => {
  window.addEventListener('storage', notify);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(changeEvent, notify);
  };
};
const toggle = () => {
  fallback = !snapshot();
  try { window.localStorage.setItem(key, String(fallback)); } catch { /* Storage may be disabled. */ }
  window.dispatchEvent(new Event(changeEvent));
};

export const useAdminSidebar = (): readonly [boolean, () => void] => [
  useSyncExternalStore(subscribe, snapshot, () => false),
  toggle,
];

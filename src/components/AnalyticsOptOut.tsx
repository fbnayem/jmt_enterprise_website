"use client";

import { useSyncExternalStore } from "react";

const KEY = "jmt-analytics-opt-out";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/** Lets a visitor switch analytics off (or back on) on this device. */
export function AnalyticsOptOut() {
  const optedOut = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    read,
    () => false,
  );
  const toggle = () => {
    const next = !optedOut;
    try {
      if (next) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch {}
    window.gtag?.("consent", "update", { analytics_storage: next ? "denied" : "granted" });
    listeners.forEach((l) => l());
  };
  return (
    <div className="card mt-6 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted" aria-live="polite">
        {optedOut ? "Analytics is turned off on this device." : "Anonymous analytics helps JMT improve this website."}
      </p>
      <button type="button" className="btn-secondary" onClick={toggle}>
        {optedOut ? "Turn analytics back on" : "Turn off analytics"}
      </button>
    </div>
  );
}

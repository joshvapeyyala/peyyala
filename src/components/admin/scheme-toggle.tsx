"use client";

import { useSyncExternalStore } from "react";
import { schemeKey as key } from "./options";

// Light / dark / system for the admin only (the public site's look is set on
// Appearance). Stored per browser; schemeScript in the layout applies it before paint.

const schemes = ["system", "light", "dark"] as const;
type Scheme = (typeof schemes)[number];

const listeners = new Set<() => void>();

function read(): Scheme {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function write(scheme: Scheme) {
  try {
    if (scheme === "system") localStorage.removeItem(key);
    else localStorage.setItem(key, scheme);
  } catch {}
  if (scheme === "system") delete document.documentElement.dataset.scheme;
  else document.documentElement.dataset.scheme = scheme;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const icons: Record<Scheme, string> = {
  system: "M4 5h16v11H4zM9 20h6M12 16v4",
  light: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  dark: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
};

export function SchemeToggle() {
  const scheme = useSyncExternalStore(subscribe, read, () => "system" as Scheme);

  return (
    <div role="group" aria-label="Admin colour scheme" className="flex rounded-lg border border-border bg-sunken p-0.5">
      {schemes.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={scheme === option}
          title={option[0].toUpperCase() + option.slice(1)}
          onClick={() => write(option)}
          className={`grid h-7 flex-1 place-items-center rounded-md transition-colors ${
            scheme === option ? "bg-panel text-fg shadow-sm" : "text-muted hover:text-fg"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={icons[option]} />
          </svg>
          <span className="sr-only">{option}</span>
        </button>
      ))}
    </div>
  );
}

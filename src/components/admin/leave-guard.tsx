"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

// Mounted while a screen has unsaved edits. Links inside the admin ask before
// leaving; reloads, closing the tab and links to the site get the browser's
// own "Leave site?" prompt.
export function LeaveGuard() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<string | null>(null);
  // Set once the admin confirms, so the browser prompt doesn't ask a second time
  const leaving = useRef(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!leaving.current) event.preventDefault();
    };

    // Capture phase on window runs before Next's <Link> handler
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      // Other sites, and jumps within this page (the "On this page" list), are fine
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      event.preventDefault();
      event.stopPropagation();
      setTarget(url.pathname + url.search + url.hash);
      dialog.current?.showModal();
    };

    window.addEventListener("beforeunload", warn);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  function leave() {
    if (!target) return;
    leaving.current = true;
    dialog.current?.close();
    // The public site is a separate root layout, so it needs a full page load
    if (target.startsWith("/admin")) router.push(target);
    else window.location.assign(target);
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="leave-title"
      onClose={() => setTarget(null)}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-panel p-6 text-fg shadow-xl backdrop:bg-black/50"
    >
      <h2 id="leave-title" className="text-base font-semibold">
        Leave without saving?
      </h2>
      <p className="mt-2 text-sm text-muted">Your edits on this page haven&apos;t been saved and will be lost.</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button data-ignore-dirty autoFocus onClick={() => dialog.current?.close()}>
          Stay
        </Button>
        <Button data-ignore-dirty variant="primary" onClick={leave}>
          Leave page
        </Button>
      </div>
    </dialog>
  );
}

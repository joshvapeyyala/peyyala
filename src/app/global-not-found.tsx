import type { Metadata } from "next";
import { WrongGate } from "@/components/site/wrong-gate";
import { SiteDocument } from "./(site)/site-document";

// Any URL no route matches. With two root layouts (site and admin) there's no
// single layout to wrap a 404, so this renders the site's document itself.
export const metadata: Metadata = {
  title: "Page not found — Joshva Peyyala",
};

export default function GlobalNotFound() {
  return (
    <SiteDocument>
      <main className="flex flex-1">
        <WrongGate />
      </main>
    </SiteDocument>
  );
}

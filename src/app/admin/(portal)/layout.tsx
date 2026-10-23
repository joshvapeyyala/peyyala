import { Suspense } from "react";
import { AccountMenu, AccountMenuSkeleton } from "@/components/admin/account-menu";
import { AdminShell } from "@/components/admin/admin-shell";

// Every admin screen except the login page: sidebar, mobile menu, main area.
// The shell and page content prerender; only the account menu reads the
// session, so it streams in behind <Suspense> (and redirects if signed out).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell
      account={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <AccountMenu />
        </Suspense>
      }
    >
      {children}
    </AdminShell>
  );
}

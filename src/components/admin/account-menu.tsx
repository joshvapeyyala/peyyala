import { requireAdmin } from "@/server/auth";
import { SignOutButton } from "./sign-out-button";

// The signed-in admin, at the bottom of the sidebar. It checks the session on
// every admin page (the layout renders it inside <Suspense>), and sends anyone
// without a valid session to the login page.
export async function AccountMenu() {
  const admin = await requireAdmin();
  const initials = admin.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sunken text-xs font-semibold text-fg">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{admin.name}</span>
        <span className="block truncate text-xs text-muted">{admin.email}</span>
      </span>
      <SignOutButton />
    </div>
  );
}

// Same size as the menu, so nothing shifts when it streams in
export function AccountMenuSkeleton() {
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      <span className="h-8 w-8 rounded-full bg-sunken" />
      <span className="flex flex-1 flex-col gap-1.5">
        <span className="h-3 w-24 rounded bg-sunken" />
        <span className="h-2.5 w-32 rounded bg-sunken" />
      </span>
    </div>
  );
}

import { AdminShell } from "@/components/admin/admin-shell";

// Every admin screen except the login page: sidebar, mobile menu, main area
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

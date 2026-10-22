import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProfile } from "@/lib/content";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  return (
    <>
      <SiteHeader name={profile.name} />
      <main className="flex-1">{children}</main>
      <SiteFooter profile={profile} />
    </>
  );
}

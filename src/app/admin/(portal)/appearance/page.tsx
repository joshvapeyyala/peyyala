import type { Metadata } from "next";
import { AppearancePicker, type DesignOption } from "@/components/admin/appearance-picker";
import { PageHeader } from "@/components/admin/page-header";
import { designs } from "@/content/themes";
import { fontVariables } from "@/lib/design-fonts";
import { getTheme } from "@/lib/content";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  const theme = await getTheme();

  const options: DesignOption[] = Object.entries(designs).map(([id, design]) => ({
    id,
    label: design.label,
    description: design.description,
    displayFont: design.preview.displayFont,
    uppercase: design.preview.uppercase,
    palettes: Object.entries(design.palettes).map(([paletteId, palette]) => ({
      id: paletteId,
      label: palette.label,
      scheme: palette.scheme,
      tokens: palette.tokens,
    })),
  }));

  return (
    // The site's design fonts, so the previews render in Anton, Sora, ...
    <div className={fontVariables}>
      <PageHeader
        title="Appearance"
        description="Choose the public site's design and colour palette. Visitors always see the one you pick here."
      />
      <AppearancePicker designs={options} current={{ design: theme.design, palette: theme.palette }} />
    </div>
  );
}

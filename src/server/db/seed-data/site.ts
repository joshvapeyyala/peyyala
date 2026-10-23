import type { ThemeSetting } from "@/content/themes";

// The look a freshly seeded database starts with. After that, the admin's
// Appearance screen sets it (stored in site_settings).
export const theme: ThemeSetting = { design: "ink", palette: "ink" };

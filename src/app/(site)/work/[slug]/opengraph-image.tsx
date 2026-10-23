import { ImageResponse } from "next/og";
import { getProject, getProjects } from "@/lib/content";
import { antonFont, themeColors, publicImage } from "@/lib/og";

export const alt = "Project case study by Joshva Peyyala";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  const fonts = await antonFont();
  const colors = await themeColors();

  if (!project) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", background: colors.bg }} />,
      { ...size, fonts },
    );
  }

  const shot = project.screenshot ? await publicImage(project.screenshot.src) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <div
          style={{
            width: 520,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 0 64px 72px",
          }}
        >
          <span style={{ fontSize: 24, color: colors.muted, letterSpacing: 3 }}>CASE STUDY</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontFamily: "Anton", fontSize: 120, lineHeight: 0.9 }}>
              {project.name.toUpperCase()}
            </span>
            <span style={{ fontSize: 30, color: colors.muted }}>{project.category}</span>
          </div>
          <span style={{ fontSize: 26 }}>
            Joshva Peyyala · <span style={{ color: colors.accent, marginLeft: 8 }}>peyyala.com</span>
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", paddingLeft: 48 }}>
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img>
            <img
              src={shot}
              alt=""
              width={760}
              height={475}
              style={{
                borderRadius: "20px 0 0 20px",
                border: `2px solid ${colors.line}`,
                borderRight: "none",
                objectFit: "cover",
                objectPosition: "left top",
              }}
            />
          ) : null}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

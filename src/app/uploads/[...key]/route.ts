// Serves uploaded files from local storage (see src/server/storage.ts). Once
// files live in S3, their URLs point there and this route goes unused.
import { read } from "@/server/storage";

const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...key]">) {
  const { key } = await ctx.params;
  const name = key.at(-1) ?? "";
  const type = contentTypes[name.split(".").pop()?.toLowerCase() ?? ""];
  const bytes = type ? await read(key.join("/")) : null;
  if (!type || !bytes) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": type,
      // A URL always holds the same bytes (it contains their hash)
      "Cache-Control": "public, max-age=31536000, immutable",
      // Opens in the browser; "Save as" keeps the file's own name
      "Content-Disposition": `inline; filename="${name}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

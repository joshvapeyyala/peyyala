// Checks an uploaded file before it's stored. The type comes from the file's
// bytes, not its name or the browser's claim, so a renamed file can't slip through.
import "server-only";
import { disableTypes, imageSize, types } from "image-size";
import { maxUploadBytes } from "@/lib/schemas";

// Parse only the formats the site accepts. Fewer parsers means less code
// reading untrusted bytes (some formats' parsers have had hang bugs).
disableTypes(types.filter((type) => !["png", "jpg", "webp"].includes(type)));

const maxUploadLabel = `${maxUploadBytes / 1024 / 1024} MB`;

type Checked<T> = { ok: true; file: T } | { ok: false; message: string };

async function readUpload(value: FormDataEntryValue | null): Promise<Checked<Uint8Array>> {
  if (!(value instanceof File) || value.size === 0) return { ok: false, message: "Choose a file to upload." };
  if (value.size > maxUploadBytes) return { ok: false, message: `That file is over ${maxUploadLabel}.` };
  return { ok: true, file: new Uint8Array(await value.arrayBuffer()) };
}

const imageTypes = { png: "png", jpg: "jpg", webp: "webp" } as const;

export type CheckedImage = { bytes: Uint8Array; width: number; height: number; extension: string };

export async function checkImage(value: FormDataEntryValue | null): Promise<Checked<CheckedImage>> {
  const upload = await readUpload(value);
  if (!upload.ok) return upload;
  let size: ReturnType<typeof imageSize>;
  try {
    size = imageSize(upload.file);
  } catch {
    return { ok: false, message: "That isn't an image this site can use. Upload a PNG, JPEG or WebP." };
  }
  const extension = imageTypes[size.type as keyof typeof imageTypes];
  if (!extension) return { ok: false, message: "Upload a PNG, JPEG or WebP image." };
  // Photos from phones store their rotation separately; width and height as displayed
  const turned = size.orientation !== undefined && size.orientation >= 5;
  const width = turned ? size.height : size.width;
  const height = turned ? size.width : size.height;
  if (width < 200 || height < 100) return { ok: false, message: "That image is too small. Use one at least 200 pixels wide." };
  if (width > 8000 || height > 8000) return { ok: false, message: "That image is too large. Keep it under 8000 pixels on each side." };
  return { ok: true, file: { bytes: upload.file, width, height, extension } };
}

export async function checkPdf(value: FormDataEntryValue | null): Promise<Checked<Uint8Array>> {
  const upload = await readUpload(value);
  if (!upload.ok) return upload;
  // Every PDF starts with "%PDF-"
  const signature = new TextDecoder().decode(upload.file.subarray(0, 5));
  if (signature !== "%PDF-") return { ok: false, message: "That isn't a PDF. Export your resume as a PDF and try again." };
  return upload;
}

// A safe file name for downloads: "My Resume (2).pdf" -> "My-Resume-2.pdf"
export function cleanFileName(name: string, fallback: string) {
  const base = name
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || fallback;
}

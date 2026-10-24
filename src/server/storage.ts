// Uploaded files (screenshots, the resume PDF), kept in an S3 bucket: one per
// environment (joshua-portfolio-dev, joshua-portfolio-prod). The rest of the
// app only calls these functions, so changing where files live changes this
// file alone.
//
// Files are named after a hash of their contents, so a URL always points at
// the same bytes and can be cached forever; replacing a file means a new URL.
// Visitors load them straight from the bucket, which allows public reads;
// only the app's keys can write or delete.
import "server-only";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, NoSuchKey, NotFound, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION;
// The bucket's web address, e.g. https://joshua-portfolio-dev.s3.ap-south-1.amazonaws.com
const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, "");

// Read on first use, so pages that never touch uploads work without these
function client() {
  if (!bucket || !region || !publicUrl) throw new Error("Uploads need S3_BUCKET, S3_REGION and STORAGE_PUBLIC_URL. See .env.example.");
  const globalForS3 = globalThis as unknown as { s3?: S3Client };
  // S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY; left empty, the SDK looks for
  // credentials the usual AWS ways (environment, ~/.aws)
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  globalForS3.s3 ??= new S3Client({ region, ...(accessKeyId && secretAccessKey && { credentials: { accessKeyId, secretAccessKey } }) });
  return { s3: globalForS3.s3, bucket };
}

const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

// Keys are folder/name paths of plain characters, e.g. "screenshots/3f2a9c1e5b7d0a42/lineage.png"
const keyPattern = /^[a-z0-9_-]+(\/[a-z0-9._-]+)+$/i;

export function isStorageKey(key: string) {
  return keyPattern.test(key) && !key.split("/").some((part) => part === "." || part === "..");
}

// A file in /public, for URLs that aren't uploads
function publicFile(url: string) {
  return path.join(process.cwd(), "public", url);
}

// Saves the bytes under `folder`, named by their hash, and returns the public URL
export async function put(folder: string, bytes: Uint8Array, name: string): Promise<string> {
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const key = `${folder}/${hash}/${name}`;
  const contentType = contentTypes[name.split(".").pop()?.toLowerCase() ?? ""];
  if (!isStorageKey(key) || !contentType) throw new Error(`Invalid storage key: ${key}`);
  const { s3, bucket } = client();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      // A URL always holds the same bytes (it contains their hash)
      CacheControl: "public, max-age=31536000, immutable",
      // Opens in the browser; "Save as" keeps the file's own name
      ContentDisposition: `inline; filename="${name}"`,
    }),
  );
  return `${publicUrl}/${key}`;
}

// The stored file behind a key from put(), or null if there isn't one
export async function read(key: string): Promise<Uint8Array | null> {
  if (!isStorageKey(key)) return null;
  const { s3, bucket } = client();
  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return (await object.Body?.transformToByteArray()) ?? null;
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    throw error;
  }
}

// The bytes behind a URL: an uploaded file, or one in /public. Null if missing.
export async function readUrl(url: string): Promise<Uint8Array | null> {
  const key = keyOf(url);
  if (key) return read(key);
  if (!url.startsWith("/")) return null;
  try {
    return await readFile(publicFile(url));
  } catch {
    return null;
  }
}

// Deletes a file saved by put(). URLs of files in /public are left alone.
// Callers have already saved their change, so a failure is logged, not thrown:
// a leftover file costs next to nothing, a failed save message would mislead.
export async function remove(url: string | null | undefined) {
  const key = keyOf(url);
  if (!key) return;
  const { s3, bucket } = client();
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    console.error(`Storage: couldn't delete ${key}; it stays in the bucket.`, error);
  }
}

// Whether a URL points at a file that exists: an uploaded one, or one in /public
export async function fileExists(url: string): Promise<boolean> {
  const key = keyOf(url);
  if (key) {
    const { s3, bucket } = client();
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (error) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }
  if (!url.startsWith("/")) return false;
  try {
    await access(publicFile(url));
    return true;
  } catch {
    return false;
  }
}

// The key inside this bucket's URL, or null for any other URL
function keyOf(url: string | null | undefined) {
  const prefix = publicUrl && `${publicUrl}/`;
  const key = prefix && url?.startsWith(prefix) ? url.slice(prefix.length) : null;
  return key && isStorageKey(key) ? key : null;
}

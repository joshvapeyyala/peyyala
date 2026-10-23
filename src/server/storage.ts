// Uploaded files (screenshots, the resume PDF). The rest of the app only calls
// these functions, so moving from a local folder to S3 changes this file alone.
//
// Files are named after a hash of their contents, so a URL always points at
// the same bytes and can be cached forever; replacing a file means a new URL.
//
// Local (the default): files live in STORAGE_DIR (./storage) and are served by
// src/app/uploads/[...key]/route.ts at /uploads/<key>. Not in /public, which
// is for files that ship with the code.
import "server-only";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";

const driver = process.env.STORAGE_DRIVER ?? "local";
if (driver !== "local") throw new Error(`STORAGE_DRIVER "${driver}" isn't set up yet. Only "local" works for now.`);

const publicPrefix = "/uploads/";

// Keys are folder/name paths of plain characters, e.g. "screenshots/3f2a9c1e5b7d0a42/lineage.png"
const keyPattern = /^[a-z0-9_-]+(\/[a-z0-9._-]+)+$/i;

export function isStorageKey(key: string) {
  return keyPattern.test(key) && !key.split("/").some((part) => part === "." || part === "..");
}

// Where a key's file lives on disk. Uploads are data, not code: the ignore
// comments stop the build from bundling this folder (or, unable to tell which
// folder it is, the whole project) with the server.
function fileOf(key: string) {
  return path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "storage", key);
}

// A file in /public, for URLs that aren't uploads
function publicFile(url: string) {
  return path.join(process.cwd(), "public", url);
}

// Saves the bytes under `folder`, named by their hash, and returns the public URL
export async function put(folder: string, bytes: Uint8Array, name: string): Promise<string> {
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const key = `${folder}/${hash}/${name}`;
  if (!isStorageKey(key)) throw new Error(`Invalid storage key: ${key}`);
  const file = fileOf(key);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ file, bytes);
  return publicPrefix + key;
}

// The stored file behind a key from put(), or null if there isn't one
export async function read(key: string): Promise<Uint8Array | null> {
  if (!isStorageKey(key)) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ fileOf(key));
  } catch {
    return null;
  }
}

// The bytes behind a URL: an uploaded file, or one in /public. Null if missing.
export async function readUrl(url: string): Promise<Uint8Array | null> {
  const key = keyOf(url);
  if (key) return read(key);
  try {
    return await readFile(publicFile(url));
  } catch {
    return null;
  }
}

// Deletes a file saved by put(). URLs of files in /public are left alone.
export async function remove(url: string | null | undefined) {
  const key = keyOf(url);
  if (!key) return;
  const file = fileOf(key);
  await rm(/*turbopackIgnore: true*/ file, { force: true });
  // Then the hash folder, unless the same bytes are also stored under another name
  await rmdir(/*turbopackIgnore: true*/ path.dirname(file)).catch(() => {});
}

// Whether a URL points at a file that exists: an uploaded one, or one in /public
export async function fileExists(url: string): Promise<boolean> {
  const key = keyOf(url);
  try {
    await access(/*turbopackIgnore: true*/ key ? fileOf(key) : publicFile(url));
    return true;
  } catch {
    return false;
  }
}

function keyOf(url: string | null | undefined) {
  const key = url?.startsWith(publicPrefix) ? url.slice(publicPrefix.length) : null;
  return key && isStorageKey(key) ? key : null;
}

import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import {
  isValidDownloadId,
  sanitizeContentDispositionFilename,
} from "@/lib/sanitize";

interface CachedDownload {
  buffer: Buffer;
  filename: string;
  expiresAt: number;
}

interface CachedDownloadMeta {
  filename: string;
  expiresAt: number;
  createdAt: number;
  lastAccessedAt?: number;
}

const TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_DIR = path.join(tmpdir(), "vibecore-download-cache");

function getZipPath(id: string): string {
  return path.join(CACHE_DIR, `${id}.zip`);
}

function getMetaPath(id: string): string {
  return path.join(CACHE_DIR, `${id}.json`);
}

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing or already-deleted files.
  }
}

async function cleanupExpiredDownloads(): Promise<void> {
  await ensureCacheDir();

  let entries: string[] = [];
  try {
    entries = await fs.readdir(CACHE_DIR);
  } catch {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .map(async (entry) => {
        const metaPath = path.join(CACHE_DIR, entry);

        try {
          const metaRaw = await fs.readFile(metaPath, "utf8");
          const meta = JSON.parse(metaRaw) as CachedDownloadMeta;
          if (Date.now() <= meta.expiresAt) return;

          const id = path.basename(entry, ".json");
          await Promise.all([safeUnlink(metaPath), safeUnlink(getZipPath(id))]);
        } catch {
          await safeUnlink(metaPath);
        }
      })
  );
}

export async function setDownloadCache(
  id: string,
  buffer: Buffer,
  filename: string
): Promise<void> {
  if (!isValidDownloadId(id)) {
    throw new Error("Invalid download ID format");
  }

  await ensureCacheDir();
  await cleanupExpiredDownloads();

  const expiresAt = Date.now() + TTL;
  const meta: CachedDownloadMeta = {
    filename: sanitizeContentDispositionFilename(filename),
    expiresAt,
    createdAt: Date.now(),
  };

  await Promise.all([
    fs.writeFile(getZipPath(id), buffer),
    fs.writeFile(getMetaPath(id), JSON.stringify(meta), "utf8"),
  ]);
}

export async function getDownloadCache(id: string): Promise<CachedDownload | null> {
  if (!isValidDownloadId(id)) {
    return null;
  }

  await ensureCacheDir();

  try {
    const metaPath = getMetaPath(id);
    const [metaRaw, buffer] = await Promise.all([
      fs.readFile(metaPath, "utf8"),
      fs.readFile(getZipPath(id)),
    ]);

    const meta = JSON.parse(metaRaw) as CachedDownloadMeta;
    if (Date.now() > meta.expiresAt) {
      await Promise.all([safeUnlink(metaPath), safeUnlink(getZipPath(id))]);
      return null;
    }

    const nextMeta: CachedDownloadMeta = {
      ...meta,
      lastAccessedAt: Date.now(),
    };
    await fs.writeFile(metaPath, JSON.stringify(nextMeta), "utf8");

    return {
      buffer,
      filename: sanitizeContentDispositionFilename(meta.filename),
      expiresAt: meta.expiresAt,
    };
  } catch {
    return null;
  }
}

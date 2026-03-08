/**
 * localStorage-based generation history for Vibecore.
 * Stores versioned app generations per app (keyed by app slug).
 *
 * Key format: getStorageKey, deleteAppBySlug, and getVersionsBySlug must all use
 * the same prefix + slug pattern for consistent storage and retrieval.
 */

import type {
  AppConfig,
  GeneratedFile,
  GenerationDebugData,
  GenerationVersion,
} from "@/types";

const HISTORY_KEY_PREFIX = "vibecore-history-";
const MAX_VERSIONS = 20;

export function getAppSlug(appName: string): string {
  return appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 30);
}

function getStorageKey(config: AppConfig): string {
  const slug = getAppSlug(config.appName);
  return `vibecore-history-${slug}`;
}

function guard(fn: () => void): void {
  if (typeof window !== "undefined") {
    fn();
  }
}

export function saveVersion(
  config: AppConfig,
  files: GeneratedFile[],
  message: string,
  chatSummary?: string,
  debug?: GenerationDebugData
): void {
  guard(() => {
    const key = getStorageKey(config);
    const id = crypto.randomUUID?.() ?? `v-${Date.now()}`;
    const version: GenerationVersion = {
      id,
      files,
      config,
      message,
      debug,
      timestamp: Date.now(),
      chatSummary,
    };

    let versions: GenerationVersion[] = [];
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as { versions: GenerationVersion[] };
        versions = parsed.versions ?? [];
      }
    } catch {
      /* ignore */
    }

    versions.unshift(version);
    if (versions.length > MAX_VERSIONS) {
      versions = versions.slice(0, MAX_VERSIONS);
    }

    try {
      localStorage.setItem(key, JSON.stringify({ versions }));
    } catch {
      /* quota exceeded */
    }
  });
}

export function getVersions(config: AppConfig): GenerationVersion[] {
  if (typeof window === "undefined") return [];
  const key = getStorageKey(config);
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as { versions: GenerationVersion[] };
    return parsed.versions ?? [];
  } catch {
    return [];
  }
}

export function deleteVersion(config: AppConfig, id: string): void {
  guard(() => {
    const key = getStorageKey(config);
    const versions = getVersions(config).filter((v) => v.id !== id);
    try {
      localStorage.setItem(key, JSON.stringify({ versions }));
    } catch {
      /* ignore */
    }
  });
}

export function deleteAppBySlug(slug: string): void {
  guard(() => {
    try {
      localStorage.removeItem(`${HISTORY_KEY_PREFIX}${slug}`);
    } catch {
      /* ignore */
    }
  });
}

export function deleteApp(config: AppConfig): void {
  deleteAppBySlug(getAppSlug(config.appName));
}

export function getVersion(
  config: AppConfig,
  id: string
): GenerationVersion | null {
  const versions = getVersions(config);
  return versions.find((v) => v.id === id) ?? null;
}

export interface StoredAppSummary {
  slug: string;
  appName: string;
  timestamp: number;
  versionCount: number;
}

export function getAllStoredApps(): StoredAppSummary[] {
  if (typeof window === "undefined") return [];
  const apps: StoredAppSummary[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(HISTORY_KEY_PREFIX)) continue;
      const slug = key.slice(HISTORY_KEY_PREFIX.length);
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      const parsed = JSON.parse(stored) as { versions: GenerationVersion[] };
      const versions = parsed.versions ?? [];
      if (versions.length === 0) continue;
      const latest = versions[0];
      apps.push({
        slug,
        appName: latest.config.appName,
        timestamp: latest.timestamp,
        versionCount: versions.length,
      });
    }
    apps.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    /* ignore */
  }
  return apps;
}

export function getVersionsBySlug(slug: string): GenerationVersion[] {
  if (typeof window === "undefined") return [];
  const key = `${HISTORY_KEY_PREFIX}${slug}`;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as { versions: GenerationVersion[] };
    return parsed.versions ?? [];
  } catch {
    return [];
  }
}

export function getLatestVersionBySlug(
  slug: string
): GenerationVersion | null {
  const versions = getVersionsBySlug(slug);
  return versions[0] ?? null;
}

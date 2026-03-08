import JSZip from "jszip";
import { getTemplateFiles } from "@/lib/templates";
import { escapeHtml, sanitizeZipPath } from "@/lib/sanitize";
import type { AppConfig, GeneratedFile } from "@/types";

export interface PreparedZipDownload {
  downloadId: string;
  downloadUrl: string;
  bridgeUrl: string;
  filename: string;
}

function writePreparingMessage(downloadWindow: Window, filename: string): void {
  try {
    const safeFilename = escapeHtml(filename);
    downloadWindow.document.title = "Preparing download";
    downloadWindow.document.body.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 24px; line-height: 1.5;">
        <h1 style="font-size: 18px; margin: 0 0 8px;">Preparing download</h1>
        <p style="margin: 0; color: #555;">Getting <strong>${safeFilename}</strong> ready...</p>
      </div>
    `;
  } catch {
    // Ignore DOM access errors for windows the browser restricts.
  }
}

function buildFolderName(appName: string): string {
  return appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildZipFilename(config: AppConfig, filenameSuffix?: string): string {
  const folderName = buildFolderName(config.appName);
  return filenameSuffix !== undefined
    ? `${folderName}-${filenameSuffix}.zip`
    : `${folderName}.zip`;
}

function sanitizeGeneratedFiles(files: GeneratedFile[]): GeneratedFile[] {
  return files
    .map((file) => ({
      ...file,
      path: sanitizeZipPath(file.path),
    }))
    .filter((file) => file.path.length > 0);
}

/**
 * Prepares a ZIP on the server and returns a one-time download URL.
 * This avoids relying on iframe-local download behavior.
 */
export async function prepareZipDownload(
  config: AppConfig,
  generatedFiles: GeneratedFile[],
  filenameSuffix?: string
): Promise<PreparedZipDownload> {
  const filename = buildZipFilename(config, filenameSuffix);
  const response = await fetch("/api/download?prepare=true", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      config,
      files: sanitizeGeneratedFiles(generatedFiles),
      filename,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Failed to prepare ZIP (${response.status})`
    );
  }

  const data = (await response.json()) as { downloadId?: string };
  if (!data.downloadId) {
    throw new Error("Download preparation did not return a download ID");
  }

  return {
    downloadId: data.downloadId,
    downloadUrl: resolvePreparedZipDownloadUrl(data.downloadId),
    bridgeUrl: resolvePreparedZipBridgeUrl(data.downloadId, filename),
    filename,
  };
}

export function openPreparedZipWindow(filename: string): Window | null {
  if (typeof window === "undefined") {
    return null;
  }

  const downloadWindow = window.open("", "_blank");
  if (downloadWindow) {
    writePreparingMessage(downloadWindow, filename);
  }

  return downloadWindow;
}

export function resolvePreparedZipDownloadUrl(downloadId: string): string {
  if (typeof window === "undefined") {
    throw new Error("Download URL can only be resolved in the browser");
  }

  return new URL(`/api/download/${downloadId}`, window.location.origin).toString();
}

export function resolvePreparedZipBridgeUrl(
  downloadId: string,
  filename?: string
): string {
  if (typeof window === "undefined") {
    throw new Error("Bridge URL can only be resolved in the browser");
  }

  const url = new URL(`/download/${downloadId}`, window.location.origin);
  if (filename) {
    url.searchParams.set("filename", filename);
  }
  return url.toString();
}

export async function openPreparedZipDownload(
  prepared: PreparedZipDownload,
  downloadWindow?: Window | null,
  sdkClient?: {
    navigateToExternalUrl: (url: string, newTab?: boolean) => Promise<void>;
  }
): Promise<void> {
  if (downloadWindow && !downloadWindow.closed) {
    downloadWindow.location.replace(prepared.bridgeUrl);
    return;
  }

  if (sdkClient) {
    await sdkClient.navigateToExternalUrl(prepared.bridgeUrl, true);
    return;
  }

  if (typeof window === "undefined") {
    throw new Error("Downloads can only be started in the browser");
  }

  // Same-tab navigation avoids popup blockers after the async prepare step.
  window.location.assign(prepared.downloadUrl);
}

/**
 * Client-side ZIP build + anchor download. Fails in cross-origin iframes
 * (Chrome/Edge ignore download attribute). Keep only as a local fallback.
 */
export async function buildAndDownloadZip(
  config: AppConfig,
  generatedFiles: GeneratedFile[],
  filenameSuffix?: string
): Promise<void> {
  const zip = new JSZip();
  const folderName = buildFolderName(config.appName);
  const root = zip.folder(folderName);
  if (!root) throw new Error("Failed to create ZIP folder");

  const templateFiles = getTemplateFiles(config);
  for (const [path, content] of Object.entries(templateFiles)) {
    root.file(path, content);
  }

  for (const file of sanitizeGeneratedFiles(generatedFiles)) {
    root.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const filename = buildZipFilename(config, filenameSuffix);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import JSZip from "jszip";
import { getTemplateFiles } from "@/lib/templates";
import { setDownloadCache } from "@/lib/download-cache";
import {
  sanitizeContentDispositionFilename,
  sanitizeZipPath,
} from "@/lib/sanitize";
import type { AppConfig, GeneratedFile } from "@/types";

function buildFolderName(appName: string): string {
  return appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * GET: Shown when the download tab loads directly (e.g. user refreshed).
 * POST is the actual download trigger.
 */
export function GET() {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Download</title></head><body style="font-family:system-ui;padding:2rem;text-align:center"><p>Use the Download button in Vibecore to get your app ZIP.</p><p><small>You can close this tab.</small></p></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

/**
 * Server-side ZIP generation endpoint.
 *
 * Browsers block client-side blob downloads (`saveAs`, `<a download>`) inside
 * cross-origin iframes. By generating the ZIP server-side and returning it with
 * `Content-Disposition: attachment`, the browser handles the download natively —
 * even inside iframes — without JavaScript download APIs.
 *
 * The client can either request the binary directly or prepare a cached
 * one-time download URL for iframe-safe host navigation.
 */
const MAX_DOWNLOAD_BODY_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_DOWNLOAD_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    // Support both JSON (fetch) and form-encoded (hidden form) payloads
    const contentType = req.headers.get("content-type") || "";
    let config: AppConfig;
    let files: GeneratedFile[];
    let filenameOverride: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      config = body.config;
      files = body.files;
      filenameOverride = body.filename;
    } else {
      // Form-encoded: payload is in a single "payload" field as JSON
      const formData = await req.formData();
      const payload = formData.get("payload");
      if (!payload || typeof payload !== "string") {
        return NextResponse.json(
          { error: "Missing payload field" },
          { status: 400 }
        );
      }
      const parsed = JSON.parse(payload);
      config = parsed.config;
      files = parsed.files;
      filenameOverride =
        typeof formData.get("filename") === "string"
          ? (formData.get("filename") as string)
          : undefined;
    }

    if (!config?.appName) {
      return NextResponse.json(
        { error: "Missing config.appName" },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const folderName = buildFolderName(config.appName);
    const root = zip.folder(folderName);
    if (!root) {
      return NextResponse.json(
        { error: "Failed to create ZIP structure" },
        { status: 500 }
      );
    }

    // 1. Add template files
    const templateFiles = getTemplateFiles(config);
    for (const [path, content] of Object.entries(templateFiles)) {
      root.file(path, content);
    }

    // 2. Add/override with review working-copy files
    if (files?.length) {
      for (const f of files) {
        const normalizedPath = sanitizeZipPath(f.path);
        if (normalizedPath.length > 0) {
          root.file(normalizedPath, f.content);
        }
      }
    }

    // README is now included via getTemplateFiles() — no hardcoded duplicate needed

    // 3. Generate ZIP as Node buffer
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    // 4. Check if this is a "prepare" request (returns download ID instead of binary)
    //    Used by iframe-embedded clients that cannot trigger downloads directly.
    const url = new URL(req.url);
    if (url.searchParams.get("prepare") === "true") {
      const downloadId = randomUUID();
      const downloadFilename = filenameOverride ?? `${folderName}.zip`;
      await setDownloadCache(downloadId, buffer, downloadFilename);
      console.info("[download] prepared zip", {
        downloadId,
        filename: downloadFilename,
        size: buffer.length,
      });
      return NextResponse.json({ downloadId });
    }

    // 5. Return as downloadable attachment (direct binary response)
    const downloadFilename = sanitizeContentDispositionFilename(
      filenameOverride ?? `${folderName}.zip`
    );
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate ZIP",
      },
      { status: 500 }
    );
  }
}

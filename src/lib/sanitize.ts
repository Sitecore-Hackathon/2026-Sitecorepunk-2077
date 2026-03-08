/**
 * Shared sanitization utilities for security hardening.
 * Used across download, deploy, and zip-builder to prevent path traversal,
 * header injection, and XSS.
 */

/** UUID v4 regex for download cache IDs. */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if id matches UUID v4 format.
 * Used to prevent path traversal in download cache.
 */
export function isValidDownloadId(id: string): boolean {
  return typeof id === "string" && UUID_V4_REGEX.test(id.trim());
}

/**
 * Sanitizes a file path for use in ZIP or deploy.
 * Filters out ".", "..", and empty segments to prevent path traversal.
 */
export function sanitizeZipPath(filePath: string): string {
  const safeSegments = filePath
    .replace(/\\/g, "/")
    .split("/")
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== ".."
    );

  return safeSegments.join("/");
}

/**
 * Sanitizes a filename for use in Content-Disposition header.
 * Prevents header injection via quotes, newlines, and path separators.
 * Returns "download.zip" if result would be empty.
 */
export function sanitizeContentDispositionFilename(filename: string): string {
  const trimmed = filename.trim();
  if (trimmed.length === 0) return "download.zip";

  const sanitized = trimmed
    .replace(/["\r\n\0\\/]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .trim();

  return sanitized.length > 0 ? sanitized : "download.zip";
}

/**
 * Escapes HTML special characters for safe insertion into innerHTML.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c] ?? c);
}

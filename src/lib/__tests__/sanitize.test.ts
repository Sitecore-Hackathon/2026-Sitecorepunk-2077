import { describe, it, expect } from "vitest";
import {
  isValidDownloadId,
  sanitizeZipPath,
  sanitizeContentDispositionFilename,
  escapeHtml,
} from "@/lib/sanitize";

describe("isValidDownloadId", () => {
  it("accepts valid UUID v4", () => {
    expect(isValidDownloadId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidDownloadId("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")).toBe(true);
  });

  it("rejects path traversal attempts", () => {
    expect(isValidDownloadId("../../../etc/passwd")).toBe(false);
    expect(isValidDownloadId("..\\..\\..\\etc\\passwd")).toBe(false);
  });

  it("rejects empty or invalid formats", () => {
    expect(isValidDownloadId("")).toBe(false);
    expect(isValidDownloadId("not-a-uuid")).toBe(false);
    expect(isValidDownloadId("550e8400-e29b-41d4-a716")).toBe(false);
  });
});

describe("sanitizeZipPath", () => {
  it("filters out . and .. segments", () => {
    expect(sanitizeZipPath("a/../b/./c")).toBe("a/b/c");
    expect(sanitizeZipPath("../../etc/passwd")).toBe("etc/passwd");
  });

  it("normalizes backslashes to forward slashes", () => {
    expect(sanitizeZipPath("a\\b\\c")).toBe("a/b/c");
  });

  it("returns empty for path with only traversal", () => {
    expect(sanitizeZipPath("../..")).toBe("");
  });

  it("preserves valid paths", () => {
    expect(sanitizeZipPath("components/AppFeature.tsx")).toBe(
      "components/AppFeature.tsx"
    );
  });
});

describe("sanitizeContentDispositionFilename", () => {
  it("strips dangerous characters", () => {
    expect(sanitizeContentDispositionFilename('test".zip')).not.toContain('"');
    expect(sanitizeContentDispositionFilename("test\r\n.zip")).not.toContain(
      "\r"
    );
  });

  it("returns download.zip for empty result", () => {
    expect(sanitizeContentDispositionFilename("")).toBe("download.zip");
    expect(sanitizeContentDispositionFilename("   ")).toBe("download.zip");
  });

  it("allows safe characters", () => {
    expect(sanitizeContentDispositionFilename("my-app-v1.0.zip")).toBe(
      "my-app-v1.0.zip"
    );
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });
});

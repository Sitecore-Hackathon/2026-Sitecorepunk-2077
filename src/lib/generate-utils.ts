import { PROTECTED_TEMPLATE_PATHS } from "@/lib/templates";
import type { GeneratedFile } from "@/types";

/** Remove any LLM-generated files that match protected template paths. */
export function filterProtectedFiles(files: GeneratedFile[]): {
  files: GeneratedFile[];
  strippedProtectedFiles: string[];
} {
  const removed = files.filter((f) => PROTECTED_TEMPLATE_PATHS.has(f.path));
  if (removed.length > 0) {
    console.log(
      `[generate] Stripped ${removed.length} protected files:`,
      removed.map((f) => f.path)
    );
  }
  return {
    files: files.filter((f) => !PROTECTED_TEMPLATE_PATHS.has(f.path)),
    strippedProtectedFiles: removed.map((file) => file.path),
  };
}

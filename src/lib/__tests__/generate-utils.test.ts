import { describe, it, expect } from "vitest";
import { filterProtectedFiles } from "@/lib/generate-utils";
import type { GeneratedFile } from "@/types";

describe("filterProtectedFiles", () => {
  it("strips protected template paths from output", () => {
    const files: GeneratedFile[] = [
      { path: "app/page.tsx", content: "export default function Page() {}" },
      { path: "components/MyNewComponent.tsx", content: "export function MyNew() {}" },
    ];

    const result = filterProtectedFiles(files);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("components/MyNewComponent.tsx");
    expect(result.strippedProtectedFiles).toContain("app/page.tsx");
  });

  it("returns all files when none are protected", () => {
    const files: GeneratedFile[] = [
      { path: "services/MyService.ts", content: "x" },
      { path: "components/MyNewComponent.tsx", content: "y" },
    ];

    const result = filterProtectedFiles(files);

    expect(result.files).toHaveLength(2);
    expect(result.strippedProtectedFiles).toHaveLength(0);
  });

  it("returns empty when all files are protected", () => {
    const files: GeneratedFile[] = [
      { path: "app/layout.tsx", content: "x" },
      { path: "hooks/useMarketplaceClient.ts", content: "y" },
    ];

    const result = filterProtectedFiles(files);

    expect(result.files).toHaveLength(0);
    expect(result.strippedProtectedFiles).toHaveLength(2);
  });
});

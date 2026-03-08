import { describe, it, expect } from "vitest";
import { getTemplateFiles } from "@/lib/templates";
import type { AppConfig } from "@/types";

describe("getTemplateFiles", () => {
  const minimalConfig: AppConfig = {
    extensionPoint: "standalone",
    appName: "TestApp",
    description: "A test app",
    features: [],
  };

  it("returns expected keys for minimal config", () => {
    const files = getTemplateFiles(minimalConfig);

    expect(files).toHaveProperty("package.json");
    expect(files).toHaveProperty("next.config.js");
    expect(files).toHaveProperty("tsconfig.json");
    expect(files).toHaveProperty("marketplace-manifest.json");
    expect(files).toHaveProperty("app/page.tsx");
    expect(files).toHaveProperty("app/layout.tsx");
    expect(files).toHaveProperty("app/globals.css");
    expect(files).toHaveProperty("components/MarketplaceApp.tsx");
    expect(files).toHaveProperty("components/AppFeature.tsx");
    expect(files).toHaveProperty("hooks/useMarketplaceClient.ts");
    expect(files).toHaveProperty("README.md");
  });

  it("includes .env.example when external-api feature is selected", () => {
    const configWithApi: AppConfig = {
      ...minimalConfig,
      features: ["external-api"],
    };

    const files = getTemplateFiles(configWithApi);

    expect(files).toHaveProperty(".env.example");
  });

  it("excludes .env.example when external-api is not selected", () => {
    const files = getTemplateFiles(minimalConfig);

    expect(files).not.toHaveProperty(".env.example");
  });

  it("package.json name is derived from app name", () => {
    const files = getTemplateFiles(minimalConfig);
    const pkg = JSON.parse(files["package.json"]);

    expect(pkg.name).toBe("testapp");
  });
});

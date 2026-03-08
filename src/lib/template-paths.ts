/**
 * Lightweight list of template file paths — safe to import in "use client"
 * components without bundling the large template string constants from
 * lib/templates.ts.
 */
export const BASE_TEMPLATE_PATHS: readonly string[] = [
  // Config files
  "package.json",
  "next.config.js",
  "tsconfig.json",
  "tailwind.config.ts",
  "postcss.config.js",
  "components.json",
  "marketplace-manifest.json",
  "vercel.json",
  ".gitignore",
  "README.md",
  // Domain types stub
  "types/index.ts",
  // App entry
  "app/globals.css",
  "app/layout.tsx",
  "app/page.tsx",
  // Core components
  "components/MarketplaceApp.tsx",
  "components/AppFeature.tsx",
  "components/ErrorDisplay.tsx",
  // UI components
  "components/ui/button.tsx",
  "components/ui/card.tsx",
  "components/ui/badge.tsx",
  "components/ui/input.tsx",
  "components/ui/skeleton.tsx",
  // Hooks
  "hooks/useMarketplaceClient.ts",
  "hooks/usePageContext.ts",
  // Utils
  "lib/utils.ts",
  "lib/install-guide-profile.ts",
];

/** Returns the full template path list, including feature-conditional paths. */
export function getTemplatePaths(features: string[]): string[] {
  const paths = [...BASE_TEMPLATE_PATHS];
  if (features.includes("external-api")) {
    paths.push(".env.example");
  }
  return paths;
}

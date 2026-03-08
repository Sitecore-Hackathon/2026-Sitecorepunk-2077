import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import { resolveEffectiveAppSettings } from "@/lib/app-settings-server";
import { buildSystemPrompt, buildRefinementPrompt } from "@/lib/prompts";
import { filterProtectedFiles } from "@/lib/generate-utils";
import type {
  AppConfig,
  GeneratedFile,
  GenerationDebugData,
  GenerationResult,
} from "@/types";

interface GenerateRequest {
  config: AppConfig;
  existingFiles?: GeneratedFile[];
  chatMessage?: string;
  settings?: AppSettingsOverrides;
}

// ─── File Extraction ────────────────────────────────────────────────

// Primary format:  ```tsx:path/to/file.tsx
const CODE_BLOCK_REGEX = /```(?:\w+)(?::([^\n]+))?\s*\n([\s\S]*?)```/g;

// Fallback: extract path from first-line comment like `// path/to/file.tsx`
const COMMENT_PATH_REGEX = /^\/\/\s*([a-zA-Z@][\w./@-]*\.\w+)\s*$/;

// Also match: `// File: path/to/file.tsx`
const FILE_LABEL_REGEX =
  /^\/\/\s*(?:File|Path|Filename):\s*([a-zA-Z@][\w./@-]*\.\w+)\s*$/i;

function extractPathFromContent(content: string): {
  path: string | null;
  cleanContent: string;
} {
  const lines = content.split("\n");
  if (lines.length < 2) return { path: null, cleanContent: content };

  const firstLine = lines[0].trim();

  let m = firstLine.match(COMMENT_PATH_REGEX);
  if (m?.[1] && m[1].includes("/")) {
    return { path: m[1], cleanContent: lines.slice(1).join("\n").trim() };
  }

  m = firstLine.match(FILE_LABEL_REGEX);
  if (m?.[1]) {
    return { path: m[1], cleanContent: lines.slice(1).join("\n").trim() };
  }

  return { path: null, cleanContent: content };
}

function extractFiles(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const re = new RegExp(CODE_BLOCK_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(response)) !== null) {
    const rawContent = (match[2] ?? "").trim();
    if (!rawContent) continue;

    let path = match[1]?.trim() || null;
    let content = rawContent;

    if (!path) {
      const extracted = extractPathFromContent(rawContent);
      path = extracted.path;
      content = extracted.cleanContent;
    }

    if (!path || !content) continue;

    // Normalize path: strip leading ./ or /
    path = path.replace(/^\.?\//, "");

    files.push({ path, content });
  }

  return files;
}

function stripCodeBlocks(response: string): string {
  return response.replace(CODE_BLOCK_REGEX, "").trim();
}

function extractTextContent(response: Anthropic.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");
}

function summarizeGeneratedFiles(
  files: GeneratedFile[],
  existingFiles: GeneratedFile[] = []
): GenerationDebugData["generatedFiles"] {
  const existingMap = new Map(existingFiles.map((file) => [file.path, file.content]));
  const added: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];

  for (const file of files) {
    const previous = existingMap.get(file.path);
    if (previous === undefined) {
      added.push(file.path);
      continue;
    }
    if (previous === file.content) {
      unchanged.push(file.path);
      continue;
    }
    updated.push(file.path);
  }

  return {
    count: files.length,
    paths: files.map((file) => file.path),
    added,
    updated,
    unchanged,
  };
}

// ─── Protected Files & Export Normalization ─────────────────────────

/** Ensure components/AppFeature.tsx has both named and default exports. */
function normalizeAppFeature(files: GeneratedFile[]): {
  files: GeneratedFile[];
  appFeatureExportsNormalized: boolean;
} {
  const idx = files.findIndex((f) => f.path === "components/AppFeature.tsx");
  if (idx === -1) {
    return { files, appFeatureExportsNormalized: false };
  }

  let content = files[idx].content;
  let normalized = false;
  const hasNamedExport =
    /export\s+(?:function|const)\s+AppFeature\b/.test(content);

  if (!hasNamedExport) {
    // Check for `export default function AppFeature`
    const defaultAppFeature =
      /export\s+default\s+function\s+AppFeature\b/.test(content);
    if (defaultAppFeature) {
      // Convert `export default function AppFeature` to named export + default
      content = content.replace(
        /export\s+default\s+function\s+AppFeature\b/,
        "export function AppFeature"
      );
      content += "\n\nexport default AppFeature;\n";
      normalized = true;
    } else {
      // Look for any default export and add a named alias
      const defaultMatch = content.match(
        /export\s+default\s+(?:function\s+)?(\w+)/
      );
      if (defaultMatch) {
        const name = defaultMatch[1];
        content += `\n\nexport { ${name} as AppFeature };\n`;
        normalized = true;
      }
    }
  }

  // Ensure default export exists too (for maximum compatibility)
  if (!/export\s+default/.test(content)) {
    content += "\n\nexport default AppFeature;\n";
    normalized = true;
  }

  if (content !== files[idx].content) {
    console.log("[generate] Normalized AppFeature.tsx exports");
    files[idx] = { ...files[idx], content };
    normalized = true;
  }

  return {
    files,
    appFeatureExportsNormalized: normalized,
  };
}

// ─── Validation ─────────────────────────────────────────────────────

// Pre-installed file paths that always exist in the template
const PREINSTALLED_PATHS = new Set([
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "hooks/useMarketplaceClient.ts",
  "hooks/useMarketplaceClient",
  "hooks/usePageContext.ts",
  "hooks/usePageContext",
  "components/ErrorDisplay.tsx",
  "components/ErrorDisplay",
  "components/MarketplaceApp.tsx",
  "components/MarketplaceApp",
  "components/AppFeature.tsx",
  "components/AppFeature",
  "components/ui/button.tsx",
  "components/ui/button",
  "components/ui/card.tsx",
  "components/ui/card",
  "components/ui/badge.tsx",
  "components/ui/badge",
  "components/ui/input.tsx",
  "components/ui/input",
  "components/ui/skeleton.tsx",
  "components/ui/skeleton",
  "lib/utils.ts",
  "lib/utils",
  "types/index.ts",
  "types/index",
  "types",
]);

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function mergeGeneratedFiles(
  existingFiles: GeneratedFile[] = [],
  updatedFiles: GeneratedFile[] = []
): GeneratedFile[] {
  const fileMap = new Map(existingFiles.map((file) => [file.path, file]));
  for (const file of updatedFiles) {
    fileMap.set(file.path, file);
  }
  return Array.from(fileMap.values());
}

interface ValidateFilesOptions {
  existingFiles?: GeneratedFile[];
  requireGeneratedAppFeature?: boolean;
}

function validateFiles(
  files: GeneratedFile[],
  options: ValidateFilesOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const effectiveFiles = mergeGeneratedFiles(options.existingFiles, files);

  // Build set of all available paths (effective files + pre-installed)
  const availablePaths = new Set<string>();
  for (const file of effectiveFiles) {
    availablePaths.add(file.path);
    availablePaths.add(file.path.replace(/\.\w+$/, ""));
  }

  // 1. Check AppFeature.tsx exists
  const appFeatureSourceFiles = options.requireGeneratedAppFeature
    ? files
    : effectiveFiles;
  const hasAppFeature = appFeatureSourceFiles.some(
    (f) =>
      f.path === "components/AppFeature.tsx" ||
      f.path === "components/AppFeature.jsx"
  );
  if (!hasAppFeature) {
    errors.push(
      options.requireGeneratedAppFeature
        ? "components/AppFeature.tsx was not generated. This is the required entry point for your feature UI."
        : "components/AppFeature.tsx is missing from the effective app state. This is the required entry point for your feature UI."
    );
  }

  // 2. Check all @/ imports resolve against the effective app state
  for (const file of files) {
    const importRe = /from\s+["']@\/([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(file.content)) !== null) {
      const imp = m[1];
      const normalized = imp.replace(/\.\w+$/, "");
      if (
        !PREINSTALLED_PATHS.has(imp) &&
        !PREINSTALLED_PATHS.has(normalized) &&
        !availablePaths.has(imp) &&
        !availablePaths.has(normalized)
      ) {
        errors.push(
          `${file.path} imports "@/${imp}" which does not exist. Either generate it or remove the import.`
        );
      }
    }
  }

  // 3. Check .tsx files have "use client"
  for (const file of files) {
    if (
      file.path.endsWith(".tsx") &&
      !file.path.startsWith("app/api/") &&
      !file.content.trimStart().startsWith('"use client"') &&
      !file.content.trimStart().startsWith("'use client'")
    ) {
      warnings.push(
        `${file.path} is a .tsx file but is missing "use client" directive at the top.`
      );
    }
  }

  // 4. Check for import of ClientSDK type (common mistake: importing the class instead of the type)
  for (const file of files) {
    if (
      file.content.includes(
        'import { ClientSDK } from "@sitecore-marketplace-sdk/client"'
      ) &&
      !file.path.includes("Service")
    ) {
      // Components should use `import type`, services can import directly
      warnings.push(
        `${file.path} imports ClientSDK as a value. Components should use: import type { ClientSDK } from "@sitecore-marketplace-sdk/client"`
      );
    }
  }

  return { errors, warnings };
}

// ─── Fix-Up Pass ────────────────────────────────────────────────────

const FIX_SYSTEM = `You are a code repair assistant. You will receive a set of generated files for a Next.js Sitecore Marketplace app, along with a list of build errors found by static analysis.

Your job: Fix ONLY the errors listed. Output the corrected files using the exact same format:

\`\`\`tsx:path/to/file.tsx
// corrected content
\`\`\`

Rules:
1. Only output files that need changes. Unchanged files should NOT be output.
2. If a file imports a component that doesn't exist, you have two choices:
   a. Generate the missing file (preferred if it's a meaningful component)
   b. Inline the component's functionality into the importing file (if it's simple)
3. Every code block MUST use the \`\`\`lang:filepath format.
4. Output COMPLETE file contents — never truncate.
5. Maintain all existing functionality. Do not remove features.
6. All .tsx component files must have "use client" at the top.
7. Available pre-installed imports: @/hooks/useMarketplaceClient, @/hooks/usePageContext, @/components/ErrorDisplay, @/components/MarketplaceApp, @/components/AppFeature, @/components/ui/button, @/components/ui/card, @/components/ui/badge, @/components/ui/input, @/components/ui/skeleton, @/lib/utils, @/types (types/index.ts — stub exists, override with real types), lucide-react.
8. NEVER generate components/MarketplaceApp.tsx or app/page.tsx — they are locked template files.
9. The main feature component MUST be at components/AppFeature.tsx with a named export: export function AppFeature({ client }: { client: ClientSDK }).`;

async function fixFiles(
  client: Anthropic,
  model: string,
  files: GeneratedFile[],
  errors: string[]
): Promise<GeneratedFile[]> {
  const fileList = files
    .map((f) => `\`\`\`tsx:${f.path}\n${f.content}\n\`\`\``)
    .join("\n\n");

  const errorList = errors.map((e) => `• ${e}`).join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 16384,
    system: FIX_SYSTEM,
    messages: [
      {
        role: "user",
        content: `## GENERATED FILES\n\n${fileList}\n\n## ERRORS TO FIX\n\n${errorList}\n\nFix these errors. Output only the files that need changes.`,
      },
    ],
  });

  const text = extractTextContent(response);
  const fixedFiles = extractFiles(text);

  // Merge: fixed files replace originals, untouched files stay
  const fileMap = new Map(files.map((f) => [f.path, f]));
  for (const f of fixedFiles) {
    fileMap.set(f.path, f);
  }

  return Array.from(fileMap.values());
}

// ─── Main Handler ───────────────────────────────────────────────────

const MAX_GENERATE_BODY_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_GENERATE_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    const body: GenerateRequest = await req.json();
    const effectiveSettings = resolveEffectiveAppSettings(body.settings);
    const apiKey = effectiveSettings.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not configured. Add it to .env.local or save a local override in Settings.",
        },
        { status: 500 }
      );
    }

    if (!body.config?.extensionPoint || !body.config?.appName) {
      return NextResponse.json(
        { error: "Missing required config fields" },
        { status: 400 }
      );
    }

    const isRefinement =
      body.chatMessage && body.existingFiles && body.existingFiles.length > 0;

    const systemPrompt = isRefinement
      ? buildRefinementPrompt(
          body.config,
          body.existingFiles!,
          body.chatMessage!
        )
      : buildSystemPrompt(body.config, undefined);

    const userMessage = isRefinement
      ? body.chatMessage!
      : `Build the "${body.config.appName}" app: ${body.config.description}`;

    const model = effectiveSettings.ANTHROPIC_MODEL;
    const client = new Anthropic({ apiKey });
    const validationOptions: ValidateFilesOptions = {
      existingFiles: isRefinement ? body.existingFiles : undefined,
      requireGeneratedAppFeature: !isRefinement,
    };

    // ── Pass 1: Generate ──────────────────────────────────────────
    console.log("[generate] Pass 1: Generating app...");
    const response = await client.messages.create({
      model,
      max_tokens: 16384,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const assistantContent = extractTextContent(response);
    let files = extractFiles(assistantContent);
    const message = stripCodeBlocks(assistantContent);
    const debugNormalization: GenerationDebugData["normalization"] = {
      strippedProtectedFiles: [],
      appFeatureExportsNormalized: false,
    };
    const debugFixup: GenerationDebugData["fixup"] = {
      attempted: false,
      errorsBefore: [],
      errorsAfter: [],
      failed: false,
    };

    if (files.length === 0) {
      return NextResponse.json<GenerationResult>({
        files: [],
        message:
          "No files were extracted from the response. The AI may have used an unsupported format. Try again with a simpler description.",
      });
    }

    // ── Pass 1b: Filter & Normalize ──────────────────────────────
    console.log(
      `[generate] Pass 1b: Filtering protected files & normalizing exports...`
    );
    const filtered = filterProtectedFiles(files);
    files = filtered.files;
    debugNormalization.strippedProtectedFiles.push(
      ...filtered.strippedProtectedFiles
    );

    const normalized = normalizeAppFeature(files);
    files = normalized.files;
    debugNormalization.appFeatureExportsNormalized =
      debugNormalization.appFeatureExportsNormalized ||
      normalized.appFeatureExportsNormalized;

    // ── Pass 2: Validate ──────────────────────────────────────────
    console.log(`[generate] Pass 2: Validating ${files.length} files...`);
    let validation = validateFiles(files, validationOptions);

    // ── Pass 3: Fix-up (if errors found) ──────────────────────────
    if (validation.errors.length > 0) {
      debugFixup.attempted = true;
      debugFixup.reason = "Validation errors detected after initial generation";
      debugFixup.errorsBefore = [...validation.errors];
      console.log(
        `[generate] Found ${validation.errors.length} errors. Running fix-up pass...`
      );
      console.log("[generate] Errors:", validation.errors);

      try {
        files = await fixFiles(client, model, files, validation.errors);

        // Re-apply protections after fix-up (LLM might re-generate protected files)
        const postFixFiltered = filterProtectedFiles(files);
        files = postFixFiltered.files;
        debugNormalization.strippedProtectedFiles.push(
          ...postFixFiltered.strippedProtectedFiles
        );

        const postFixNormalized = normalizeAppFeature(files);
        files = postFixNormalized.files;
        debugNormalization.appFeatureExportsNormalized =
          debugNormalization.appFeatureExportsNormalized ||
          postFixNormalized.appFeatureExportsNormalized;

        // Re-validate after fix
        validation = validateFiles(files, validationOptions);
        debugFixup.errorsAfter = [...validation.errors];

        if (validation.errors.length > 0) {
          console.warn(
            "[generate] Fix-up pass did not resolve all errors:",
            validation.errors
          );
        } else {
          console.log("[generate] Fix-up pass resolved all errors.");
        }
      } catch (fixError) {
        console.error("[generate] Fix-up pass failed:", fixError);
        debugFixup.failed = true;
        debugFixup.failureMessage =
          fixError instanceof Error ? fixError.message : "Fix-up pass failed";
        debugFixup.errorsAfter = [...validation.errors];
        // Continue with original files + warning
      }
    }

    // ── Build response message ────────────────────────────────────
    let finalMessage = message || "App generated successfully.";

    if (validation.errors.length > 0) {
      finalMessage +=
        "\n\n⚠️ Build issues detected (auto-fix attempted but some remain):\n" +
        validation.errors.map((e) => `• ${e}`).join("\n") +
        "\n\nUse the chat to ask for fixes.";
    }

    if (validation.warnings.length > 0) {
      console.log("[generate] Warnings:", validation.warnings);
    }

    const RAW_RESPONSE_MAX_LENGTH = 4096;
    const rawResponse =
      assistantContent.length > RAW_RESPONSE_MAX_LENGTH
        ? assistantContent.slice(0, RAW_RESPONSE_MAX_LENGTH) +
          "\n\n[... truncated for response size ...]"
        : assistantContent;

    const debug: GenerationDebugData = {
      assistantSummary: finalMessage,
      rawAssistantResponse: rawResponse,
      generatedFiles: summarizeGeneratedFiles(files, body.existingFiles),
      validation: {
        errors: [...validation.errors],
        warnings: [...validation.warnings],
      },
      fixup: debugFixup,
      normalization: {
        strippedProtectedFiles: Array.from(
          new Set(debugNormalization.strippedProtectedFiles)
        ),
        appFeatureExportsNormalized:
          debugNormalization.appFeatureExportsNormalized,
      },
      requestContext: {
        isRefinement: Boolean(isRefinement),
        extensionPoint: body.config.extensionPoint,
        features: body.config.features,
        existingFileCount: body.existingFiles?.length ?? 0,
        chatMessage: body.chatMessage,
      },
    };

    return NextResponse.json<GenerationResult>({
      files,
      message: finalMessage,
      debug,
    });
  } catch (error: unknown) {
    console.error("Generate API error:", error);

    const statusCode = (error as { status?: number })?.status;
    if (statusCode === 401) {
      return NextResponse.json(
        {
          error:
            "Invalid API key. Check your ANTHROPIC_API_KEY in .env, .env.local, or the Settings override — it may be expired or incorrect.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate app. Check your API key and try again.",
      },
      { status: 500 }
    );
  }
}

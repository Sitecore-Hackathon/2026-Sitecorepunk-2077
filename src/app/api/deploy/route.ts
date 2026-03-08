import { NextResponse } from "next/server";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import { resolveEffectiveAppSettings } from "@/lib/app-settings-server";
import {
  createDeployment,
  disableProjectProtection,
  getDeploymentStatus,
} from "@/lib/deploy/vercel";
import { getTemplateFiles } from "@/lib/templates";
import { sanitizeZipPath } from "@/lib/sanitize";
import type { AppConfig, GeneratedFile } from "@/types";

interface DeployRequest {
  config: AppConfig;
  files: GeneratedFile[];
  projectId?: string;
  settings?: AppSettingsOverrides;
}

const MAX_DEPLOY_BODY_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_DEPLOY_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    const body: DeployRequest = await req.json();
    const effectiveSettings = resolveEffectiveAppSettings(body.settings);
    const token = effectiveSettings.VERCEL_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          error:
            "VERCEL_TOKEN is not configured. Add it to .env or save a local override in Settings to enable Vercel deployment.",
        },
        { status: 500 }
      );
    }

    if (!body.config?.appName || !body.files?.length) {
      return NextResponse.json(
        { error: "Missing config or files" },
        { status: 400 }
      );
    }

    // Merge template files with review working-copy files (working files override)
    const templateFiles = getTemplateFiles(body.config);
    const fileMap: Record<string, string> = { ...templateFiles };

    for (const f of body.files) {
      const safePath = sanitizeZipPath(f.path);
      if (safePath.length > 0) {
        fileMap[safePath] = f.content;
      }
    }

    // Convert to Vercel file format
    const vercelFiles = Object.entries(fileMap).map(([file, data]) => ({
      file,
      data,
      encoding: "utf-8" as const,
    }));

    // Deploy
    const projectName =
      effectiveSettings.VERCEL_PROJECT_NAME ??
      `vibecore-${body.config.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`;

    const deployment = await createDeployment({
      name: projectName,
      files: vercelFiles,
      project: body.projectId,
      target: "production",
      token,
    });

    // Disable deployment protection so preview URLs are publicly accessible (when enabled in settings)
    if (
      deployment.projectId &&
      effectiveSettings.DISABLE_VERCEL_PROTECTION !== false
    ) {
      try {
        await disableProjectProtection({
          projectId: deployment.projectId,
          teamId: effectiveSettings.VERCEL_TEAM_ID,
          token,
        });
      } catch (err) {
        console.warn(
          "Failed to disable deployment protection:",
          err instanceof Error ? err.message : err
        );
      }
    }

    const url =
      deployment.url ??
      deployment.alias?.[0] ??
      (deployment.id ? `https://${deployment.id}.vercel.app` : null);

    // Fetch full status for inspectorUrl (Vercel dashboard link)
    let inspectorUrl: string | null = null;
    try {
      const status = await getDeploymentStatus(deployment.id, token);
      inspectorUrl = status.inspectorUrl ?? null;
    } catch {
      // Non-fatal; inspectorUrl optional
    }

    return NextResponse.json({
      deploymentId: deployment.id,
      projectId: deployment.projectId ?? undefined,
      url: url ? (url.startsWith("https://") ? url : `https://${url}`) : null,
      readyState: deployment.readyState,
      inspectorUrl,
    });
  } catch (error) {
    console.error("Deploy error:", error);
    const message = error instanceof Error ? error.message : "Deploy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

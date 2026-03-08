import { NextResponse } from "next/server";
import { getTemplateFiles } from "@/lib/templates";
import { getTemplatePaths } from "@/lib/template-paths";
import type { AppConfig } from "@/types";

/**
 * Fetches a single template file's content for display in the code viewer.
 * Path is validated against allowed template paths only — no filesystem access.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { path: rawPath, config } = body as {
      path?: string;
      config?: AppConfig;
    };

    if (!rawPath || typeof rawPath !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid path" },
        { status: 400 }
      );
    }

    if (!config?.appName) {
      return NextResponse.json(
        { error: "Missing or invalid config" },
        { status: 400 }
      );
    }

    const path = rawPath.replace(/\\/g, "/").trim();
    if (path.includes("..") || path.startsWith("/") || path.startsWith("\\")) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    const allowedPaths = getTemplatePaths(config.features ?? []);
    if (!allowedPaths.includes(path)) {
      return NextResponse.json(
        { error: "Path not in template set" },
        { status: 404 }
      );
    }

    const templateFiles = getTemplateFiles(config);
    const content = templateFiles[path];
    if (content === undefined) {
      return NextResponse.json(
        { error: "Template content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ path, content });
  } catch (error) {
    console.error("Template API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

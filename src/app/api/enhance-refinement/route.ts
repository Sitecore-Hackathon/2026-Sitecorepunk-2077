import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import { resolveEffectiveAppSettings } from "@/lib/app-settings-server";
import type { AppConfig } from "@/types";

interface EnhanceRefinementRequest {
  refinementPrompt: string;
  config: AppConfig;
  settings?: AppSettingsOverrides;
}

const EXTENSION_LABELS: Record<string, string> = {
  standalone: "Standalone app in Cloud Portal",
  "xmc:pages:contextpanel": "Side panel in SitecoreAI Pages editor",
  "xmc:pages:customfield": "Custom field type in page editor",
  "xmc:dashboardblocks": "Widget on SitecoreAI dashboard",
  "xmc:fullscreen": "Full-screen overlay in SitecoreAI",
};

const ENHANCE_REFINEMENT_SYSTEM = `You are a Sitecore Marketplace app refinement specialist. The user has an existing generated app and wants to make changes. Your job is to take their brief refinement instruction and expand it into a clear, specific, actionable prompt for an AI code generator.

Rules:
- Preserve the user's exact intent — do not add or remove features they didn't ask for
- Make the instruction more specific: clarify UI placement, component structure, data sources, and interactions
- Reference Sitecore concepts correctly when relevant: items, fields, GraphQL, Experience Edge, pages, sites
- Focus on WHAT to change, not HOW (no implementation details like "use useState")
- Keep it concise but complete — 1-4 sentences typically
- Output ONLY the enhanced refinement prompt text — no preamble, no "Here is...", no markdown, no JSON`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: EnhanceRefinementRequest = await req.json();
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

    const trimmed = body.refinementPrompt?.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Provide a refinement prompt to enhance." },
        { status: 400 }
      );
    }

    const extensionLabel =
      EXTENSION_LABELS[body.config?.extensionPoint] ??
      body.config?.extensionPoint ??
      "Sitecore Marketplace app";

    const model = effectiveSettings.ANTHROPIC_MODEL;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: 256,
      system: ENHANCE_REFINEMENT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `App context: ${body.config?.appName ?? "Generated app"} (${extensionLabel})\n\nUser's refinement instruction:\n${trimmed}\n\nEnhance this into a clear, specific refinement prompt. Output only the enhanced text.`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "Failed to get enhancement response." },
        { status: 500 }
      );
    }

    return NextResponse.json({ refinementPrompt: text });
  } catch (error: unknown) {
    console.error("Enhance refinement API error:", error);

    const statusCode = (error as { status?: number })?.status;
    if (statusCode === 401) {
      return NextResponse.json(
        { error: "Invalid API key." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Enhancement failed.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import { resolveEffectiveAppSettings } from "@/lib/app-settings-server";
import type { ExtensionPointType } from "@/types";

interface EnhanceRequest {
  appName: string;
  description: string;
  extensionPoint: ExtensionPointType;
  settings?: AppSettingsOverrides;
}

const EXTENSION_LABELS: Record<string, string> = {
  standalone: "Standalone app in Portal Shell",
  "xmc:pages:contextpanel": "Side panel in SitecoreAI Pages editor",
  "xmc:pages:customfield": "Custom field type in page editor",
  "xmc:dashboardblocks": "Widget on SitecoreAI dashboard",
  "xmc:fullscreen": "Full-screen overlay in SitecoreAI",
};

const ENHANCE_SYSTEM = `You are a Sitecore Marketplace app naming and requirements specialist. Your job is to take a rough app name and description and enhance them to be clear, specific, and optimized for AI code generation.

Rules:
- The enhanced app name should be concise (2-5 words), professional, and descriptive
- The enhanced description must be a detailed, structured specification (3-6 sentences)
- Include specifics about: data sources (which Sitecore APIs), UI layout (cards, tables, lists), user interactions (click, search, filter), and expected outputs
- Reference Sitecore concepts correctly: items, fields, templates, Experience Edge, authoring GraphQL, pages, sites, languages
- Do NOT include implementation details like "use React" or "use Tailwind" — focus on WHAT the app does
- Keep the original intent but make it much more specific and actionable

Respond ONLY in this exact JSON format (no markdown, no explanation):
{"appName": "Enhanced Name", "description": "Enhanced detailed description."}`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: EnhanceRequest = await req.json();
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

    if (!body.appName?.trim() && !body.description?.trim()) {
      return NextResponse.json(
        { error: "Provide at least an app name or description to enhance." },
        { status: 400 }
      );
    }

    const extensionLabel =
      EXTENSION_LABELS[body.extensionPoint] ?? body.extensionPoint;

    const model = effectiveSettings.ANTHROPIC_MODEL;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: 512,
      system: ENHANCE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Extension point: ${extensionLabel}\nApp name: ${body.appName || "(none provided)"}\nDescription: ${body.description || "(none provided)"}\n\nEnhance these into a polished app name and detailed description.`,
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse enhancement response." },
        { status: 500 }
      );
    }

    const enhanced = JSON.parse(jsonMatch[0]) as {
      appName: string;
      description: string;
    };

    return NextResponse.json({
      appName: enhanced.appName || body.appName,
      description: enhanced.description || body.description,
    });
  } catch (error: unknown) {
    console.error("Enhance API error:", error);

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

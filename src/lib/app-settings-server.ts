import {
  DEFAULT_ANTHROPIC_MODEL,
  sanitizeAppSettings,
  type AppSettingsOverrides,
} from "@/lib/app-settings";

export interface EffectiveAppSettings {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL: string;
  VERCEL_TOKEN?: string;
  VERCEL_PROJECT_NAME?: string;
  VERCEL_TEAM_ID?: string;
  /** When true, call disableProjectProtection after deploy. Default true. */
  DISABLE_VERCEL_PROTECTION?: boolean;
}

export function resolveEffectiveAppSettings(
  overrides?: AppSettingsOverrides
): EffectiveAppSettings {
  const normalized = sanitizeAppSettings(overrides);

  return {
    ANTHROPIC_API_KEY:
      process.env.ANTHROPIC_API_KEY?.trim() || normalized.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL:
      process.env.ANTHROPIC_MODEL?.trim() ||
      normalized.ANTHROPIC_MODEL ||
      DEFAULT_ANTHROPIC_MODEL,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN?.trim() || normalized.VERCEL_TOKEN,
    VERCEL_PROJECT_NAME:
      process.env.VERCEL_PROJECT_NAME?.trim() ||
      normalized.VERCEL_PROJECT_NAME,
    VERCEL_TEAM_ID:
      process.env.VERCEL_TEAM_ID?.trim() || normalized.VERCEL_TEAM_ID,
    DISABLE_VERCEL_PROTECTION:
      normalized.DISABLE_VERCEL_PROTECTION !== undefined
        ? normalized.DISABLE_VERCEL_PROTECTION === "true"
        : process.env.VIBECORE_DISABLE_VERCEL_PROTECTION?.toLowerCase() !==
          "false",
  };
}

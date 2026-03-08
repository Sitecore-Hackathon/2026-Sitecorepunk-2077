export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

export const ALLOWED_ANTHROPIC_MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-20250514"
] as const;

export type AppSettingKey =
  | "ANTHROPIC_API_KEY"
  | "ANTHROPIC_MODEL"
  | "VERCEL_TOKEN"
  | "VERCEL_PROJECT_NAME"
  | "VERCEL_TEAM_ID"
  | "AUTO_REDEPLOY_ON_REFINEMENT"
  | "DISABLE_VERCEL_PROTECTION";

export interface AppSettingsOverrides {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  VERCEL_TOKEN?: string;
  VERCEL_PROJECT_NAME?: string;
  VERCEL_TEAM_ID?: string;
  AUTO_REDEPLOY_ON_REFINEMENT?: string;
  DISABLE_VERCEL_PROTECTION?: string;
}

export interface AppSettingDefinition {
  key: AppSettingKey;
  label: string;
  description: string;
  placeholder?: string;
  sensitive?: boolean;
  inputType?: "text" | "checkbox";
}

export const APP_SETTINGS_DEFINITIONS: AppSettingDefinition[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    description:
      "Used for app generation and prompt enhancement when the server env var is not configured.",
    placeholder: "sk-ant-...",
    sensitive: true,
  },
  {
    key: "ANTHROPIC_MODEL",
    label: "Anthropic Model",
    description:
      `Optional model override. Falls back to ${DEFAULT_ANTHROPIC_MODEL} when unset.`,
    placeholder: DEFAULT_ANTHROPIC_MODEL,
  },
  {
    key: "VERCEL_TOKEN",
    label: "Vercel Token",
    description:
      "Used for one-click deployments when the server env var is not configured.",
    placeholder: "your-vercel-token",
    sensitive: true,
  },
  {
    key: "VERCEL_PROJECT_NAME",
    label: "Vercel Project Name Prefix",
    description:
      "Optional project name prefix for new Vercel deployments when no env var is set.",
    placeholder: "vibecore-my-app",
  },
  {
    key: "VERCEL_TEAM_ID",
    label: "Vercel Team ID",
    description:
      "Optional Vercel team scope used when deployment protection needs to be disabled.",
    placeholder: "team_xxx",
  },
  {
    key: "AUTO_REDEPLOY_ON_REFINEMENT",
    label: "Auto-redeploy after refinement",
    description:
      "When enabled, automatically redeploy to Vercel after chat refinement when a previous deploy exists. Disable to require manual Deploy clicks.",
    inputType: "checkbox",
  },
  {
    key: "DISABLE_VERCEL_PROTECTION",
    label: "Disable Vercel deployment protection",
    description:
      "When enabled, disables SSO and password protection on deployed projects so preview URLs are publicly accessible.",
    inputType: "checkbox",
  },
];

export function sanitizeAppSettings(
  input?: Partial<AppSettingsOverrides> | null
): AppSettingsOverrides {
  if (!input) return {};

  const next: AppSettingsOverrides = {};

  for (const field of APP_SETTINGS_DEFINITIONS) {
    const rawValue = input[field.key];
    if (field.inputType === "checkbox") {
      if (typeof rawValue === "boolean") {
        next[field.key] = rawValue ? "true" : "false";
      } else if (rawValue === "true" || rawValue === "false") {
        next[field.key] = rawValue;
      }
      continue;
    }
    if (typeof rawValue !== "string") continue;

    const trimmed = rawValue.trim();
    if (trimmed.length === 0) continue;

    next[field.key] = trimmed;
  }

  // Validate model name against whitelist; invalid values silently dropped
  // so resolveEffectiveAppSettings() falls back to DEFAULT_ANTHROPIC_MODEL.
  if (
    next.ANTHROPIC_MODEL &&
    !(ALLOWED_ANTHROPIC_MODELS as readonly string[]).includes(
      next.ANTHROPIC_MODEL
    )
  ) {
    delete next.ANTHROPIC_MODEL;
  }

  return next;
}

export function hasStoredAppSettings(
  input?: Partial<AppSettingsOverrides> | null
): boolean {
  return Object.keys(sanitizeAppSettings(input)).length > 0;
}

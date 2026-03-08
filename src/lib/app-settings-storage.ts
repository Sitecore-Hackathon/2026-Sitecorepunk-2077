import {
  hasStoredAppSettings,
  sanitizeAppSettings,
  type AppSettingsOverrides,
} from "@/lib/app-settings";

const STORAGE_KEY = "vibecore-settings-v1";
const STORAGE_PREFIX = "vb1:";

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function obfuscateSettings(settings: AppSettingsOverrides): string {
  const json = JSON.stringify(sanitizeAppSettings(settings));
  const reversed = json.split("").reverse().join("");
  return `${STORAGE_PREFIX}${encodeBase64(reversed)}`;
}

function deobfuscateSettings(value: string): AppSettingsOverrides {
  if (!value.startsWith(STORAGE_PREFIX)) {
    return {};
  }

  const encoded = value.slice(STORAGE_PREFIX.length);
  const reversed = decodeBase64(encoded);
  const json = reversed.split("").reverse().join("");
  const parsed = JSON.parse(json) as AppSettingsOverrides;
  return sanitizeAppSettings(parsed);
}

export function loadStoredAppSettings(): AppSettingsOverrides {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return deobfuscateSettings(stored);
  } catch {
    return {};
  }
}

export function saveStoredAppSettings(
  settings: AppSettingsOverrides
): AppSettingsOverrides {
  const sanitized = sanitizeAppSettings(settings);

  if (typeof window === "undefined") {
    return sanitized;
  }

  try {
    if (!hasStoredAppSettings(sanitized)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return {};
    }

    window.localStorage.setItem(STORAGE_KEY, obfuscateSettings(sanitized));
  } catch {
    /* ignore localStorage quota or availability issues */
  }

  return sanitized;
}

export function clearStoredAppSettings(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  APP_SETTINGS_DEFINITIONS,
  hasStoredAppSettings,
  sanitizeAppSettings,
  type AppSettingsOverrides,
} from "@/lib/app-settings";
import { Save, Settings, ShieldAlert, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettingsOverrides;
  onSave: (settings: AppSettingsOverrides) => void;
  onClear: () => void;
}

export function SettingsPanel({
  open,
  onOpenChange,
  settings,
  onSave,
  onClear,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<AppSettingsOverrides>(settings);
  const [justSaved, setJustSaved] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setJustSaved(false);
      setExpandedFields(new Set());
    }
  }, [open, settings]);

  const sanitizedDraft = useMemo(() => sanitizeAppSettings(draft), [draft]);
  const sanitizedSettings = useMemo(() => sanitizeAppSettings(settings), [settings]);
  const hasChanges =
    JSON.stringify(sanitizedDraft) !== JSON.stringify(sanitizedSettings);
  const hasAnyValues = hasStoredAppSettings(sanitizedDraft);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      aria-modal="true"
      role="dialog"
      aria-label="Settings"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-label="Close settings"
      />
      <div
        className="absolute right-0 top-0 bottom-0 flex w-[28rem] max-w-[90vw] flex-col border-l bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Settings className="h-4 w-4" />
              Settings
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Local overrides are only used when the matching server env var is missing.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Local-device storage only</p>
                <p className="text-xs leading-relaxed">
                  Sensitive values are obfuscated in `localStorage`, not truly encrypted.
                  Use real environment variables whenever possible.
                </p>
              </div>
            </div>
          </div>

          {APP_SETTINGS_DEFINITIONS.map((field) => {
            const isExpanded = expandedFields.has(field.key);
            return (
              <div key={field.key} className="rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedFields((prev) => {
                      const next = new Set(prev);
                      if (next.has(field.key)) next.delete(field.key);
                      else next.add(field.key);
                      return next;
                    })
                  }
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{field.label}</span>
                </button>
                {isExpanded && (
                  <div className="space-y-1.5 border-t px-3 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {field.description}
                    </p>
                    {field.inputType === "checkbox" ? (
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(draft[field.key] ?? "true") === "true"}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [field.key]: e.target.checked ? "true" : "false",
                            }))
                          }
                          className="h-4 w-4 rounded border-input"
                        />
                        <span className="text-sm">
                          {(draft[field.key] ?? "true") === "true" ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                    ) : (
                      <Input
                        type={field.sensitive ? "password" : "text"}
                        value={draft[field.key] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-4 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClear();
              setDraft({});
              setJustSaved(false);
            }}
            disabled={!hasAnyValues && !hasStoredAppSettings(settings)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Overrides
          </Button>
          <div className="flex items-center gap-2">
            {justSaved && (
              <span className="text-xs text-muted-foreground">Saved locally</span>
            )}
            <Button
              type="button"
              onClick={() => {
                onSave(sanitizedDraft);
                setJustSaved(true);
              }}
              disabled={!hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

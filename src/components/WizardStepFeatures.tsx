"use client";

import type { AppFeature, AppFeatureConfig, ExtensionPointType } from "@/types";

const FEATURES: AppFeatureConfig[] = [
  {
    id: "page-context",
    label: "Page Context Subscription",
    description: "React to page selection changes in the Pages editor",
    autoEnabled: ["xmc:pages:contextpanel"],
  },
  {
    id: "graphql-read",
    label: "Read Content (Authoring GraphQL)",
    description: "Query items, fields, and content tree via authoring API",
  },
  {
    id: "graphql-write",
    label: "Write Content (Authoring GraphQL)",
    description: "Create, update, or delete items via authoring API",
  },
  {
    id: "live-content",
    label: "Published Content (Experience Edge)",
    description: "Read live/published content via Experience Edge GraphQL",
  },
  {
    id: "external-api",
    label: "External API Integration",
    description:
      "Call third-party APIs (OpenAI, analytics, etc.) via server-side API route",
  },
];

interface WizardStepFeaturesProps {
  selected: AppFeature[];
  extensionPoint: ExtensionPointType;
  onToggle: (feature: AppFeature) => void;
}

export function WizardStepFeatures({
  selected,
  extensionPoint,
  onToggle,
}: WizardStepFeaturesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Features</h2>
        <p className="text-sm text-muted-foreground">
          Select the capabilities your app needs.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {FEATURES.map((feature) => {
          const isAutoEnabled = feature.autoEnabled?.includes(extensionPoint) ?? false;
          const isChecked = selected.includes(feature.id) || isAutoEnabled;
          return (
            <label
              key={feature.id}
              className={`flex min-h-[108px] items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                isChecked
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30"
              } ${isAutoEnabled ? "opacity-80" : ""}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isAutoEnabled}
                onChange={() => !isAutoEnabled && onToggle(feature.id)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <div className="space-y-1.5">
                <p className="text-sm font-medium leading-snug">
                  {feature.label}
                  {isAutoEnabled && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (auto-enabled)
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

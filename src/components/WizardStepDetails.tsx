"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Check,
  Lightbulb,
  X,
} from "lucide-react";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import type { ExtensionPointType } from "@/types";

interface SampleIdea {
  name: string;
  description: string;
}

const SAMPLE_IDEAS: Record<ExtensionPointType, SampleIdea[]> = {
  standalone: [
    {
      name: "SEO Governance Assistant",
      description:
        "A standalone app that audits pages for missing titles, weak metadata, and draft-versus-live mismatches, then organizes the results in a searchable table with quick links to the affected content.",
    },
    {
      name: "Localization Planning Console",
      description:
        "A standalone app that compares language coverage across sites, highlights untranslated or outdated items, and groups results by site and language for easier content planning.",
    },
    {
      name: "Content Operations Workbench",
      description:
        "A standalone app for searching pages, reviewing key fields, and performing targeted authoring actions like creating or updating content items from a multi-step workflow.",
    },
  ],
  "xmc:pages:contextpanel": [
    {
      name: "Page Readiness Checker",
      description:
        "A context panel that evaluates the currently selected page for missing metadata, empty content fields, and publish-readiness issues, updating automatically when the editor changes pages.",
    },
    {
      name: "Live vs Draft Snapshot",
      description:
        "A context panel that compares the current page's draft and live content status, showing key differences and surfacing obvious publishing drift in a compact summary.",
    },
    {
      name: "Component Inventory Panel",
      description:
        "A context panel that lists the components and layout details on the current page, flags suspicious field values, and refreshes whenever the page context or layout changes.",
    },
  ],
  "xmc:pages:customfield": [
    {
      name: "Icon Picker Field",
      description:
        "A custom field app that lets editors browse and search a controlled icon library, preview selections, and save the chosen icon token back to the field.",
    },
    {
      name: "Campaign UTM Preset Field",
      description:
        "A custom field app that helps editors choose from predefined UTM campaign presets and stores the selected campaign metadata in a single field value.",
    },
    {
      name: "Topic Taxonomy Picker",
      description:
        "A custom field app that searches a curated taxonomy, lets the editor select one or more topics, and saves the resulting IDs or labels directly into the field.",
    },
  ],
  "xmc:dashboardblocks": [
    {
      name: "Publishing Drift Widget",
      description:
        "A dashboard widget that summarizes how many tracked pages differ between preview and live content, helping editors spot publishing gaps at a glance.",
    },
    {
      name: "Broken Content Risk Widget",
      description:
        "A dashboard widget that displays counts of pages with missing required metadata, empty critical fields, or other content hygiene issues across a site.",
    },
    {
      name: "Localization Backlog Widget",
      description:
        "A dashboard widget that shows untranslated or outdated content counts by site and language, with compact summary cards for quick planning.",
    },
  ],
  "xmc:fullscreen": [
    {
      name: "Bulk Metadata Editor",
      description:
        "A full-screen SitecoreAI tool for editing titles, descriptions, and other structured metadata across many pages in a table-based bulk editing interface.",
    },
    {
      name: "Site Structure Explorer",
      description:
        "A full-screen app that lets editors browse the site tree, inspect item details, search deeply across content, and review key field values in a larger workspace.",
    },
    {
      name: "Content QA Lab",
      description:
        "A full-screen app that runs content quality checks across a selected subtree, groups failures by rule, and helps editors jump directly to problematic pages.",
    },
  ],
};

interface WizardStepDetailsProps {
  appName: string;
  description: string;
  extensionPoint: ExtensionPointType;
  settingsOverrides: AppSettingsOverrides;
  onAppNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
}

export function WizardStepDetails({
  appName,
  description,
  extensionPoint,
  settingsOverrides,
  onAppNameChange,
  onDescriptionChange,
}: WizardStepDetailsProps) {
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [showSampleIdeasPanel, setShowSampleIdeasPanel] = useState(false);
  const sampleIdeas = SAMPLE_IDEAS[extensionPoint];

  const canEnhance =
    (appName.trim().length > 0 || description.trim().length > 0) && !enhancing;

  const handleSampleSelect = (sample: SampleIdea) => {
    onAppNameChange(sample.name);
    onDescriptionChange(sample.description);
    setEnhanced(false);
    setEnhanceError(null);
    setShowSampleIdeasPanel(false);
  };

  const handleEnhance = async () => {
    if (!canEnhance) return;

    setEnhancing(true);
    setEnhanced(false);
    setEnhanceError(null);

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName,
          description,
          extensionPoint,
          settings: settingsOverrides,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || `Enhancement failed (${response.status})`
        );
      }

      const result: { appName: string; description: string } =
        await response.json();

      onAppNameChange(result.appName);
      onDescriptionChange(result.description);
      setEnhanced(true);

      // Clear success indicator after 3 seconds
      setTimeout(() => setEnhanced(false), 3000);
    } catch (err) {
      setEnhanceError(
        err instanceof Error ? err.message : "Enhancement failed"
      );
    } finally {
      setEnhancing(false);
    }
  };

  const extensionLabel = {
    standalone: "Standalone",
    "xmc:pages:contextpanel": "Context Panel",
    "xmc:pages:customfield": "Custom Field",
    "xmc:dashboardblocks": "Dashboard Widget",
    "xmc:fullscreen": "Full Screen",
  }[extensionPoint];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">App Details</h2>
            <p className="text-sm text-muted-foreground">
              Name your app and describe what it should do.<br/>Focus on the core user outcome, primary data sources, and the ideal UI for the{" "}
              <b>{extensionLabel}</b> experience.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSampleIdeasPanel(true)}
            className="h-8 gap-1.5 self-start"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            Sample Ideas
          </Button>
        </div>

        <Card padding="sm">
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">App Name</label>
              <Input
                value={appName}
                onChange={(e) => onAppNameChange(e.target.value)}
                placeholder="e.g. Site Analytics Dashboard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Describe what your app should do. Be specific about data sources, UI layout, and interactions. Mention the key data source, the main user action, and how results should be displayed. If you need live updates, authoring access, or external APIs, describe those expectations explicitly.&#10;&#10;Examples: card grid, searchable table, side panel summary, bulk editor, or approval workflow.&#10;&#10;Example: Show all SitecoreAI sites in a card grid with page counts. Click a site to see its pages in a table with name, path, and last modified date. Include a search bar to filter pages."
                rows={10}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                disabled={!canEnhance}
                className="h-8 gap-1.5"
              >
                {enhancing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enhancing...
                  </>
                ) : enhanced ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    Enhanced
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Enhance
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                AI will refine your name and description for better code generation
              </span>
            </div>

            {enhanceError && (
              <p className="text-xs text-destructive">{enhanceError}</p>
            )}
          </CardContent>
        </Card>

      </div>

      {showSampleIdeasPanel && (
        <div
          className="fixed inset-0 z-40"
          aria-modal="true"
          role="dialog"
          aria-label="Sample ideas"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSampleIdeasPanel(false)}
            aria-label="Close sample ideas panel"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-card border-l shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Sample Ideas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Realistic starter concepts tailored to this extension point.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowSampleIdeasPanel(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-lg border bg-background px-3 py-3 text-left">
                <p className="text-sm font-medium">Browse example prompts</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick one to prefill the form, then customize it for your exact workflow.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {sampleIdeas.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleSampleSelect(sample)}
                    className="w-full rounded-lg border bg-background px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium">{sample.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {sample.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

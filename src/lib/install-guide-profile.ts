"use client";

import type { AppConfig, AppFeature, ExtensionPointType } from "@/types";

export const APP_STUDIO_URL = "https://portal.sitecorecloud.io/app-studio";

export interface InstallGuideChoice {
  label: string;
  selected: boolean;
  reason: string;
}

export interface InstallGuideProfile {
  appName: string;
  appTypeLabel: string;
  extensionPoint: ExtensionPointType;
  extensionLabel: string;
  registerDesc: string;
  installOpenDesc: string;
  apiAccess: InstallGuideChoice[];
  permissions: InstallGuideChoice[];
}

const EXTENSION_LABELS: Record<ExtensionPointType, string> = {
  standalone: "Standalone",
  "xmc:pages:contextpanel": "Page Context Panel",
  "xmc:pages:customfield": "Custom Field",
  "xmc:dashboardblocks": "Dashboard Widgets",
  "xmc:fullscreen": "Full Screen",
};

const EXTENSION_INSTRUCTIONS: Record<
  ExtensionPointType,
  { registerDesc: string; installOpenDesc: string }
> = {
  standalone: {
    registerDesc:
      "Choose the Standalone extension point so the app appears in the Cloud Portal app launcher.",
    installOpenDesc:
      "After installing, open the app from the Cloud Portal app launcher.",
  },
  "xmc:fullscreen": {
    registerDesc:
      "Choose the Full Screen extension point so the app opens from Sitecore navigation.",
    installOpenDesc:
      "After installing, open the app from Sitecore navigation.",
  },
  "xmc:dashboardblocks": {
    registerDesc:
      "Choose the Dashboard Widgets extension point so the app can be added to an SitecoreAI dashboard.",
    installOpenDesc:
      "After installing, add the widget to your SitecoreAI dashboard and open it there.",
  },
  "xmc:pages:contextpanel": {
    registerDesc:
      "Choose the Page Context Panel extension point so the app appears in the Pages editor context panel.",
    installOpenDesc:
      "After installing, open a page in the Pages editor and find the app in the context panel.",
  },
  "xmc:pages:customfield": {
    registerDesc:
      "Choose the Custom Field extension point so the app can be attached to a page template field.",
    installOpenDesc:
      "After installing, add the custom field to a page template and then edit pages in the Pages editor.",
  },
};

function inferSitecoreApiAccess(features: AppFeature[]): boolean {
  return features.some((feature) =>
    ["page-context", "graphql-read", "graphql-write", "live-content"].includes(
      feature
    )
  );
}

function buildApiAccessChoices(features: AppFeature[]): InstallGuideChoice[] {
  const usesSitecoreApis = inferSitecoreApiAccess(features);

  return [
    {
      label: "SitecoreAI APIs",
      selected: usesSitecoreApis,
      reason: usesSitecoreApis
        ? "Selected because this app uses Sitecore content, page context, or GraphQL capabilities."
        : "Leave unselected if the app does not read or write Sitecore data.",
    },
    {
      label: "AI skills APIs",
      selected: false,
      reason:
        "Leave unselected. Vibecore does not currently generate AI skills API integrations from the selected features.",
    },
  ];
}

function buildPermissionChoices(): InstallGuideChoice[] {
  return [
    {
      label: "Pop-ups",
      selected: true,
      reason:
        "Selected because the generated setup experience can open App Studio or related links in a new tab.",
    },
    {
      label: "Copy to clipboard",
      selected: true,
      reason:
        "Selected because the generated guidance includes copy actions for values like the app name and deployment URL.",
    },
    {
      label: "Read from clipboard",
      selected: false,
      reason:
        "Leave unselected unless you intentionally add pasted-input behavior that reads from the clipboard.",
    },
  ];
}

export function buildInstallGuideProfile(config: AppConfig): InstallGuideProfile {
  const extensionInstructions = EXTENSION_INSTRUCTIONS[config.extensionPoint];

  return {
    appName: config.appName,
    appTypeLabel: "Custom app",
    extensionPoint: config.extensionPoint,
    extensionLabel: EXTENSION_LABELS[config.extensionPoint],
    registerDesc: extensionInstructions.registerDesc,
    installOpenDesc: extensionInstructions.installOpenDesc,
    apiAccess: buildApiAccessChoices(config.features),
    permissions: buildPermissionChoices(),
  };
}

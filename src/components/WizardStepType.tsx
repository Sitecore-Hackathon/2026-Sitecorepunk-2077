"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Layout,
  PanelLeft,
  FormInput,
  LayoutDashboard,
  Maximize,
} from "lucide-react";
import type { ExtensionPointType, ExtensionPointConfig } from "@/types";

const EXTENSION_POINTS: ExtensionPointConfig[] = [
  {
    id: "standalone",
    label: "Standalone",
    description: "Full app in Cloud Portal",
    icon: "Layout",
  },
  {
    id: "xmc:pages:contextpanel",
    label: "Context Panel",
    description: "Side panel in Pages editor",
    icon: "PanelLeft",
  },
  {
    id: "xmc:pages:customfield",
    label: "Custom Field",
    description: "Custom field type in editor",
    icon: "FormInput",
  },
  {
    id: "xmc:dashboardblocks",
    label: "Dashboard Widgets",
    description: "Widget on SitecoreAI dashboard",
    icon: "LayoutDashboard",
  },
  {
    id: "xmc:fullscreen",
    label: "Full Screen",
    description: "Full-screen overlay in SitecoreAI",
    icon: "Maximize",
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout,
  PanelLeft,
  FormInput,
  LayoutDashboard,
  Maximize,
};

interface WizardStepTypeProps {
  selected: ExtensionPointType;
  onSelect: (type: ExtensionPointType) => void;
}

export function WizardStepType({ selected, onSelect }: WizardStepTypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Choose Extension Point</h2>
        <p className="text-sm text-muted-foreground">
          Where will your app appear in Sitecore?
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {EXTENSION_POINTS.map((ep) => {
          const Icon = ICON_MAP[ep.icon];
          const isSelected = selected === ep.id;
          return (
            <Card
              key={ep.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-primary border-primary bg-primary-background"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onSelect(ep.id)}
            >
              <CardContent className="flex h-full min-h-[132px] flex-col gap-4 p-5">
                <div
                  className={`w-fit rounded-lg p-2.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </div>
                <div className="space-y-1.5">
                  <p className="font-medium text-sm">{ep.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {ep.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

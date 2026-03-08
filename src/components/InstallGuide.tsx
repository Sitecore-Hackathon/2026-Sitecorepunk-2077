"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check } from "lucide-react";
import type { AppConfig } from "@/types";
import {
  APP_STUDIO_URL,
  buildInstallGuideProfile,
  type InstallGuideChoice,
} from "@/lib/install-guide-profile";

interface InstallGuideProps {
  config: AppConfig;
  deployUrl?: string;
  knownDeployUrl?: string;
  hasPreviousDeployment?: boolean;
  vercelDashboardUrl?: string;
  embedded?: boolean;
}

interface StepLink {
  href: string;
  label: string;
}

interface Step {
  num: number;
  title: string;
  desc: string | null;
  value?: string;
  copyableValue?: string;
  links?: StepLink[];
  choices?: InstallGuideChoice[];
}

function CopyValueButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, [value]);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-1" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          {label}
        </>
      )}
    </Button>
  );
}

function buildAppStudioSteps(
  startNum: number,
  config: AppConfig,
  deploymentValue?: string
): Step[] {
  const profile = buildInstallGuideProfile(config);
  const deploymentUrl = deploymentValue ?? "http://localhost:3000";

  return [
    {
      num: startNum,
      title: "Create the app entry",
      desc: `In App Studio, choose ${profile.appTypeLabel} and use the app name below when creating the app.`,
      value: profile.appName,
      copyableValue: profile.appName,
      links: [{ href: APP_STUDIO_URL, label: "Open App Studio" }],
    },
    {
      num: startNum + 1,
      title: "Open the app configuration",
      desc: "After creating the app, click Configure.",
    },
    {
      num: startNum + 2,
      title: "Select extension point",
      desc: profile.registerDesc,
      value: profile.extensionLabel,
      copyableValue: profile.extensionLabel,
    },
    {
      num: startNum + 3,
      title: "Select API access",
      desc: "Under API access, choose the options below based on the generated app capabilities.",
      choices: profile.apiAccess,
    },
    {
      num: startNum + 4,
      title: "Select app permissions",
      desc: "Under permissions, enable only the toggles below that the generated app is expected to use.",
      choices: profile.permissions,
    },
    {
      num: startNum + 5,
      title: "Paste the deployment URL",
      desc: "Use the deployment URL below in the URL field.",
      value: deploymentUrl,
      copyableValue: deploymentUrl,
    },
    {
      num: startNum + 6,
      title: "Upload an app logo",
      desc: "Upload one square JPG, PNG, or SVG logo file. The maximum file size is 4MB.",
    },
    {
      num: startNum + 7,
      title: "Activate the app",
      desc: "After configuration is complete, click Activate in App Studio.",
    },
    {
      num: startNum + 8,
      title: "Install and open",
      desc: `After activating, install the app to the desired instance. ${profile.installOpenDesc}`,
    },
  ];
}

export function InstallGuide({
  config,
  deployUrl,
  knownDeployUrl,
  hasPreviousDeployment = false,
  vercelDashboardUrl,
  embedded = false,
}: InstallGuideProps) {
  const profile = buildInstallGuideProfile(config);
  const needsEnvSetup = config.features.includes("external-api");
  const isCurrentlyDeployed = !!deployUrl;
  const isRedeployable = hasPreviousDeployment;
  const effectiveDeployUrl = deployUrl ?? knownDeployUrl;

  const steps: Step[] = [];
  let stepNum = 1;

  if (isCurrentlyDeployed) {
    const deployLinks: StepLink[] = deployUrl
      ? [{ href: deployUrl, label: "Open app" }]
      : [];
    if (vercelDashboardUrl) deployLinks.push({ href: vercelDashboardUrl, label: "Vercel dashboard" });
    deployLinks.push({ href: APP_STUDIO_URL, label: "Sitecore App Studio" });

    // Vercel-deployed flow
    steps.push({
      num: stepNum++,
      title: "App deployed to Vercel",
      desc: `Your app is live at the URL below. You can connect a Git repo from the Vercel dashboard for ongoing development.`,
      value: deployUrl,
      copyableValue: deployUrl,
      links: deployLinks,
    });

    if (needsEnvSetup) {
      steps.push({
        num: stepNum++,
        title: "Add environment variables in Vercel",
        desc: 'Go to your Vercel project > Settings > Environment Variables. Add the API keys your app needs.',
      });
    }
    steps.push(...buildAppStudioSteps(stepNum, config, deployUrl));
  } else if (isRedeployable) {
    const redeployLinks: StepLink[] = [{ href: APP_STUDIO_URL, label: "Sitecore App Studio" }];
    if (effectiveDeployUrl) {
      redeployLinks.unshift({ href: effectiveDeployUrl, label: "Open current app" });
    }

    steps.push({
      num: stepNum++,
      title: "Redeploy to Vercel",
      desc: 'This app already has a Vercel project. Use the "Redeploy to Vercel" button above to publish the latest saved version.',
      value: effectiveDeployUrl,
      copyableValue: effectiveDeployUrl,
      links: redeployLinks,
    });

    if (needsEnvSetup) {
      steps.push({
        num: stepNum++,
        title: "Review environment variables in Vercel",
        desc: "Make sure your existing Vercel project still has the API keys this app needs.",
      });
    }
    steps.push(...buildAppStudioSteps(stepNum, config, effectiveDeployUrl));
  } else {
    // ZIP / local development flow
    steps.push({
      num: stepNum++,
      title: "Extract the ZIP",
      desc: "Unzip the downloaded file to your preferred directory.",
    });

    steps.push({
      num: stepNum++,
      title: "Install dependencies",
      desc: null,
      value: "npm install",
    });

    if (needsEnvSetup) {
      steps.push({
        num: stepNum++,
        title: "Configure environment",
        desc: "Copy .env.example to .env.local and add your API keys.",
        value: "cp .env.example .env.local",
      });
    }

    steps.push({
      num: stepNum++,
      title: "Start dev server",
      desc: null,
      value: "npm run dev",
    });

    steps.push({
      num: stepNum++,
      title: "Deploy to Vercel (or other host)",
      desc: "Push to a Git repo and import it in Vercel, or click the \"Deploy to Vercel\" button above for instant deployment.",
    });
    steps.push(...buildAppStudioSteps(stepNum, config, "http://localhost:3000"));
  }

  return (
    <Card className={embedded ? "border-0 bg-transparent shadow-none" : undefined}>
      {!embedded && (
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Install Guide</CardTitle>
            <Badge colorScheme="neutral">
              {profile.extensionLabel}
            </Badge>
            {isCurrentlyDeployed && (
              <Badge variant="default" className="bg-green-600">
                Deployed
              </Badge>
            )}
            {!isCurrentlyDeployed && isRedeployable && (
              <Badge colorScheme="neutral">
                Redeployable
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-0 pt-0" : undefined}>
        <ol className="space-y-5">
          {steps.map((step) => (
            <li key={step.num} className="flex gap-3 py-1">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                {step.num}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                {step.desc && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.desc}
                  </p>
                )}
                {step.value && (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <code className="flex-1 min-w-0 block text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                      {step.value}
                    </code>
                    {step.copyableValue && (
                      <CopyValueButton value={step.copyableValue} />
                    )}
                  </div>
                )}
                {step.choices && step.choices.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {step.choices.map((choice) => (
                      <div
                        key={choice.label}
                        className="rounded-md border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            colorScheme={choice.selected ? "success" : "neutral"}
                            size="sm"
                          >
                            {choice.selected ? "Select" : "Leave Off"}
                          </Badge>
                          <p className="text-xs font-medium">{choice.label}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {choice.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {step.links && step.links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {step.links.map((link) => (
                      <a
                        key={link.href + link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

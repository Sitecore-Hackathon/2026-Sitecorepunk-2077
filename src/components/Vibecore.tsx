"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { WizardStepType } from "@/components/WizardStepType";
import { WizardStepDetails } from "@/components/WizardStepDetails";
import { WizardStepFeatures } from "@/components/WizardStepFeatures";
import { GenerationView } from "@/components/GenerationView";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import {
  deleteApp,
  saveVersion,
  getLatestVersionBySlug,
} from "@/lib/generation-history";
import { GeneratingLoadingContent } from "@/components/GeneratingLoadingContent";
import { PreviousAppsList } from "@/components/PreviousAppsList";
import { SettingsPanel } from "@/components/SettingsPanel";
import { WelcomeModal, useWelcomeModal } from "@/components/WelcomeModal";
import {
  clearStoredAppSettings,
  loadStoredAppSettings,
  saveStoredAppSettings,
} from "@/lib/app-settings-storage";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import type {
  AppPhase,
  WizardStep,
  ExtensionPointType,
  AppFeature,
  AppConfig,
  GeneratedFile,
  GenerationDebugData,
  GenerationResult,
  GenerationVersion,
  GraphQLSchemaData,
  FileChangeSource,
  FileUpdateMeta,
} from "@/types";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { Settings } from "lucide-react";

interface VibecoreProps {
  isInSitecore: boolean;
  sdkClient?: ClientSDK;
}

const WIZARD_STEPS: WizardStep[] = ["type", "details", "features"];

function buildLegacyDebugData(
  version: Pick<GenerationVersion, "config" | "files" | "message" | "chatSummary">
): GenerationDebugData {
  return {
    assistantSummary: version.message,
    generatedFiles: {
      count: version.files.length,
      paths: version.files.map((file) => file.path),
      added: version.files.map((file) => file.path),
      updated: [],
      unchanged: [],
    },
    validation: {
      errors: [],
      warnings: [],
    },
    fixup: {
      attempted: false,
      errorsBefore: [],
      errorsAfter: [],
      failed: false,
    },
    normalization: {
      strippedProtectedFiles: [],
      appFeatureExportsNormalized: false,
    },
    requestContext: {
      isRefinement: Boolean(version.chatSummary),
      extensionPoint: version.config.extensionPoint,
      features: version.config.features,
      schemaIncluded: false,
      existingFileCount: 0,
      chatMessage: version.chatSummary,
    },
  };
}

export function Vibecore({ isInSitecore, sdkClient }: VibecoreProps) {
  // Welcome modal
  const { showWelcome, dismissWelcome } = useWelcomeModal();

  // Phase state
  const [phase, setPhase] = useState<AppPhase>("wizard");

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>("type");
  const [extensionPoint, setExtensionPoint] =
    useState<ExtensionPointType>("standalone");
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [settingsOverrides, setSettingsOverrides] = useState<AppSettingsOverrides>({});
  const [showSettings, setShowSettings] = useState(false);

  // Generation state
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationDebug, setGenerationDebug] = useState<GenerationDebugData | null>(
    null
  );
  const [lastFileChangeSource, setLastFileChangeSource] =
    useState<FileChangeSource>("initial-load");
  const [pendingCompletion, setPendingCompletion] = useState<{
    files: GeneratedFile[];
    message: string;
    debug?: GenerationDebugData;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const schemaData: GraphQLSchemaData | undefined = undefined;
  const [loadedApp, setLoadedApp] = useState<{
    config: AppConfig;
    files: GeneratedFile[];
    message: string;
    debug: GenerationDebugData;
  } | null>(null);

  const currentStepIndex = WIZARD_STEPS.indexOf(wizardStep);

  const config: AppConfig = {
    extensionPoint,
    appName,
    description,
    features:
      extensionPoint === "xmc:pages:contextpanel" &&
      !features.includes("page-context")
        ? [...features, "page-context"]
        : features,
  };

  const canProceed = (): boolean => {
    if (wizardStep === "type") return true;
    if (wizardStep === "details") return appName.trim().length > 0 && description.trim().length > 0;
    if (wizardStep === "features") return true;
    return false;
  };

  const handleNext = () => {
    const idx = currentStepIndex;
    if (idx < WIZARD_STEPS.length - 1) {
      setWizardStep(WIZARD_STEPS[idx + 1]);
    }
  };

  const handleBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setWizardStep(WIZARD_STEPS[idx - 1]);
    }
  };

  const toggleFeature = useCallback((feature: AppFeature) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  }, []);

  useEffect(() => {
    setSettingsOverrides(loadStoredAppSettings());
  }, []);

  const handleSaveSettings = useCallback((settings: AppSettingsOverrides) => {
    setSettingsOverrides(saveStoredAppSettings(settings));
  }, []);

  const handleClearSettings = useCallback(() => {
    clearStoredAppSettings();
    setSettingsOverrides({});
  }, []);

  const handleGenerate = async () => {
    setPhase("generating");
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          settings: settingsOverrides,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            `Generation failed (${response.status})`
        );
      }

      const result: GenerationResult = await response.json();

      if (result.files.length === 0) {
        throw new Error("No files were generated. Try again with a more detailed description.");
      }

      setPendingCompletion({
        files: result.files,
        message: result.message,
        debug: result.debug,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      setPhase("wizard");
    }
  };

  const handleGenerationComplete = useCallback(() => {
    if (pendingCompletion) {
      saveVersion(
        config,
        pendingCompletion.files,
        pendingCompletion.message,
        undefined,
        pendingCompletion.debug
      );
      setGeneratedFiles(pendingCompletion.files);
      setGenerationMessage(pendingCompletion.message);
      setGenerationDebug(pendingCompletion.debug ?? null);
      setLastFileChangeSource("initial-load");
      setPendingCompletion(null);
      setPhase("review");
    }
  }, [pendingCompletion, config]);

  const handleStartOver = () => {
    setPhase("wizard");
    setWizardStep("type");
    setExtensionPoint("standalone");
    setAppName("");
    setDescription("");
    setFeatures([]);
    setGeneratedFiles([]);
    setGenerationMessage("");
    setGenerationDebug(null);
    setLastFileChangeSource("initial-load");
    setError(null);
    setLoadedApp(null);
  };

  const handleOpenPreviousApp = useCallback(
    async (slug: string) => {
      const version = getLatestVersionBySlug(slug);
      if (!version) return;

      // Introspection disabled — no schema fetch when opening previous app
      setLoadedApp({
        config: version.config,
        files: version.files,
        message: version.message,
        debug: version.debug ?? buildLegacyDebugData(version),
      });
      setLastFileChangeSource("initial-load");
      setPhase("review");
    },
    []
  );

  const handleDeleteCurrentApp = useCallback(() => {
    const appToDelete = loadedApp?.config ?? config;
    deleteApp(appToDelete);
    handleStartOver();
  }, [config, loadedApp, handleStartOver]);

  const handleFilesUpdated = useCallback(
    (newFiles: GeneratedFile[], meta?: FileUpdateMeta) => {
      const effectiveConfig = loadedApp?.config ?? config;
      setLastFileChangeSource(meta?.changeSource ?? "initial-load");
      const isViewSwitch =
        meta?.changeSource === "view-version" ||
        meta?.changeSource === "delete-fallback";
      if (meta?.message !== undefined && !isViewSwitch) {
        saveVersion(
          effectiveConfig,
          newFiles,
          meta.message,
          meta.chatSummary,
          meta.debug
        );
      }
      if (loadedApp) {
        setLoadedApp((prev) =>
          prev
            ? {
                ...prev,
                files: newFiles,
                message: meta?.message ?? prev.message,
                debug: meta?.debug ?? prev.debug,
              }
            : null
        );
      } else {
        setGeneratedFiles(newFiles);
        if (meta?.message !== undefined) {
          setGenerationMessage(meta.message);
        }
        if (meta?.debug !== undefined) {
          setGenerationDebug(meta.debug);
        }
      }
    },
    [config, loadedApp]
  );

  // Generating phase
  if (phase === "generating") {
    return (
      <GeneratingScreen
        appName={appName}
        extensionPoint={extensionPoint}
        pendingCompletion={pendingCompletion}
        onComplete={handleGenerationComplete}
      />
    );
  }

  // Review phase
  if (phase === "review") {
    const reviewConfig = loadedApp?.config ?? config;
    const reviewFiles = loadedApp?.files ?? generatedFiles;
    const reviewMessage = loadedApp?.message ?? generationMessage;
    const reviewDebug =
      loadedApp?.debug ??
      generationDebug ??
      buildLegacyDebugData({
        config: reviewConfig,
        files: reviewFiles,
        message: reviewMessage,
        chatSummary: undefined,
      });
    return (
      <>
        <div className="h-screen flex flex-col">
          <div className="flex-1 min-h-0">
            <GenerationView
              config={reviewConfig}
              files={reviewFiles}
              message={reviewMessage}
              debug={reviewDebug}
              fileChangeSource={lastFileChangeSource}
              settingsOverrides={settingsOverrides}
              onFilesUpdated={handleFilesUpdated}
              onDeleteApp={handleDeleteCurrentApp}
              onOpenSettings={() => setShowSettings(true)}
              onStartOver={handleStartOver}
              sdkClient={sdkClient}
            />
          </div>
        </div>
        <SettingsPanel
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={settingsOverrides}
          onSave={handleSaveSettings}
          onClear={handleClearSettings}
        />
      </>
    );
  }

  // Wizard phase
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b px-6 py-4 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-3 md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="shrink-0">
              <Image
                src="/vibecorestudio-icon-128.png"
                alt="Vibecore Studio"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">Vibecore Studio</h1>
              <p className="text-xs text-muted-foreground">
                Marketplace App Builder
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
            <PreviousAppsList onOpenApp={handleOpenPreviousApp} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-8 gap-1.5 whitespace-nowrap"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
            {!isInSitecore && (
              <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                Demo Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex-shrink-0 px-6 py-3 border-b bg-muted/30 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 md:flex-row md:justify-center md:gap-6">
          {WIZARD_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3 min-w-0 w-full md:w-auto md:flex-initial">
              {i > 0 && (
                <div
                  className={`hidden w-8 h-0.5 flex-shrink-0 md:block ${
                    i <= currentStepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium capitalize ${
                  i <= currentStepIndex
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step === "type"
                  ? "Extension"
                  : step === "details"
                  ? "Details"
                  : "Features"}
              </span>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={`hidden w-8 h-0.5 flex-shrink-0 md:block ${
                    i < currentStepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 pb-12 lg:px-8 lg:pb-12">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="mb-4">
              <ErrorDisplay
                title="Generation Error"
                message={error}
                onRetry={() => setError(null)}
              />
            </div>
          )}

          {wizardStep === "type" && (
            <WizardStepType
              selected={extensionPoint}
              onSelect={setExtensionPoint}
            />
          )}

          {wizardStep === "details" && (
            <WizardStepDetails
              appName={appName}
              description={description}
              extensionPoint={extensionPoint}
              settingsOverrides={settingsOverrides}
              onAppNameChange={setAppName}
              onDescriptionChange={setDescription}
            />
          )}

          {wizardStep === "features" && (
            <WizardStepFeatures
              selected={features}
              extensionPoint={extensionPoint}
              onToggle={toggleFeature}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-20 flex-shrink-0 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <span className="text-[10px] text-muted-foreground/50 select-none hidden sm:block">
            Vibecore Studio · 2026 Sitecore Hackathon · Team Sitecorepunk2077
          </span>

          {wizardStep === "features" ? (
            <Button
              onClick={handleGenerate}
              disabled={!canProceed()}
              className="h-9"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Generate App
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="h-9"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settingsOverrides}
        onSave={handleSaveSettings}
        onClear={handleClearSettings}
      />

      {showWelcome && <WelcomeModal onDismiss={dismissWelcome} />}
    </div>
  );
}

// ─── Generating Screen ────────────────────────────────────────────────────────

function GeneratingScreen({
  appName,
  extensionPoint,
  pendingCompletion,
  onComplete,
}: {
  appName: string;
  extensionPoint: string;
  pendingCompletion: {
    files: GeneratedFile[];
    message: string;
    debug?: GenerationDebugData;
  } | null;
  onComplete: () => void;
}) {
  const completedRef = useRef(false);

  // When generation completes: jump to 100%, then transition after brief delay
  useEffect(() => {
    if (pendingCompletion && !completedRef.current) {
      completedRef.current = true;
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingCompletion, onComplete]);

  const label = extensionPoint
    .replace("xmc:pages:", "")
    .replace("xmc:", "")
    .replace(":", " ");

  return (
    <div className="h-screen flex items-center justify-center p-6">
      <GeneratingLoadingContent
        title={`Generating ${appName}`}
        subtitle={`Building your ${label} marketplace app...`}
        progressOverride={pendingCompletion ? 100 : undefined}
      />
    </div>
  );
}

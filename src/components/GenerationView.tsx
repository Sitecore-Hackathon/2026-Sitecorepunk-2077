"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  FileCode,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Rocket,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Bug,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  History,
  Trash2,
  GitCompare,
  X,
  Save,
  Settings,
  Copy,
  Check,
} from "lucide-react";
import { CodeFileViewer } from "@/components/CodeFileViewer";
import { InstallGuide } from "@/components/InstallGuide";
import { ChatRefinement } from "@/components/ChatRefinement";
import { MarkdownContent } from "@/components/MarkdownContent";
import { GeneratingLoadingContent } from "@/components/GeneratingLoadingContent";
import { VersionDiffView } from "@/components/VersionDiffView";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import { getTemplatePaths } from "@/lib/template-paths";
import {
  openPreparedZipWindow,
  openPreparedZipDownload,
  prepareZipDownload,
} from "@/lib/zip-builder";
import {
  getVersions,
  saveVersion,
  deleteVersion,
} from "@/lib/generation-history";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type {
  AppConfig,
  GenerationDebugData,
  GeneratedFile,
  GenerationVersion,
  FileChangeSource,
  FileUpdateMeta,
} from "@/types";
import { cn } from "@/lib/utils";

// ─── File Tree Utilities ──────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  fullPath: string;
  isDir: boolean;
  children: TreeNode[];
  isGenerated: boolean;
}

function buildTree(allPaths: string[], generatedSet: Set<string>): TreeNode[] {
  const root: TreeNode = {
    name: "",
    fullPath: "",
    isDir: true,
    children: [],
    isGenerated: false,
  };

  for (const path of allPaths) {
    const parts = path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fp = parts.slice(0, i + 1).join("/");
      const isLast = i === parts.length - 1;
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          fullPath: fp,
          isDir: !isLast,
          children: [],
          isGenerated: isLast && generatedSet.has(path),
        };
        current.children.push(child);
      }
      current = child;
    }
  }

  function sortNode(node: TreeNode) {
    node.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.filter((c) => c.isDir).forEach(sortNode);
  }
  sortNode(root);

  return root.children;
}

function getDirPaths(paths: string[]): Set<string> {
  const dirs = new Set<string>([""]);
  for (const p of paths) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  return dirs;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function DebugSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = contentRef.current?.innerText ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <details
      open={defaultOpen}
      className="rounded-md border bg-background/80 overflow-hidden"
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 flex items-center justify-between">
        <span>{title}</span>
        <button
          onClick={handleCopy}
          className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy section"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </summary>
      <div
        ref={contentRef}
        className="border-t px-3 py-2 max-h-60 overflow-y-auto"
      >
        {children}
      </div>
    </details>
  );
}

function DebugList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="font-mono break-all">
          {item}
        </li>
      ))}
    </ul>
  );
}

function DebugOutputPanel({
  message,
  debug,
  embedded = false,
}: {
  message: string;
  debug: GenerationDebugData;
  embedded?: boolean;
}) {
  const summary = debug.assistantSummary || message || "(no generation message)";
  const rawResponse =
    debug.rawAssistantResponse &&
    debug.rawAssistantResponse.trim() !== summary.trim()
      ? debug.rawAssistantResponse
      : null;
  const validationIssueCount =
    debug.validation.errors.length + debug.validation.warnings.length;

  return (
    <div
      className={
        embedded
          ? "flex-1 overflow-y-auto p-4 space-y-2"
          : "flex-shrink-0 border-b bg-muted/20 px-4 py-3 space-y-2"
      }
    >
      <p className="text-xs font-semibold text-foreground">Debug Output</p>
      <div className={embedded ? "space-y-2" : "max-h-80 overflow-y-auto space-y-2 pr-1"}>
        <DebugSection title="Summary" defaultOpen>
          <MarkdownContent content={summary} className="text-xs text-muted-foreground" />
        </DebugSection>

        <DebugSection
          title={`Validation (${validationIssueCount} issue${
            validationIssueCount === 1 ? "" : "s"
          })`}
          defaultOpen={validationIssueCount > 0}
        >
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                Errors ({debug.validation.errors.length})
              </p>
              <DebugList
                items={debug.validation.errors}
                emptyLabel="No validation errors."
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                Warnings ({debug.validation.warnings.length})
              </p>
              <DebugList
                items={debug.validation.warnings}
                emptyLabel="No validation warnings."
              />
            </div>
          </div>
        </DebugSection>

        <DebugSection
          title={`File Changes (${debug.generatedFiles.count} file${
            debug.generatedFiles.count === 1 ? "" : "s"
          })`}
        >
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Added: {debug.generatedFiles.added.length}</span>
              <span>Updated: {debug.generatedFiles.updated.length}</span>
              <span>Unchanged: {debug.generatedFiles.unchanged.length}</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                Extracted Paths
              </p>
              <DebugList
                items={debug.generatedFiles.paths}
                emptyLabel="No file paths recorded."
              />
            </div>
          </div>
        </DebugSection>

        <DebugSection
          title={`Fix-up (${debug.fixup.attempted ? "attempted" : "not needed"})`}
        >
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              {debug.fixup.attempted
                ? debug.fixup.reason ?? "Fix-up pass ran after validation errors."
                : "No fix-up pass was needed."}
            </p>
            {debug.fixup.failureMessage && (
              <p className="text-destructive">{debug.fixup.failureMessage}</p>
            )}
            {debug.fixup.attempted && (
              <>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">
                    Errors Before Fix-up
                  </p>
                  <DebugList
                    items={debug.fixup.errorsBefore}
                    emptyLabel="No pre-fix errors recorded."
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">
                    Errors After Fix-up
                  </p>
                  <DebugList
                    items={debug.fixup.errorsAfter}
                    emptyLabel="No remaining errors after fix-up."
                  />
                </div>
              </>
            )}
          </div>
        </DebugSection>

        <DebugSection title="Normalization">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              AppFeature exports normalized:{" "}
              {debug.normalization.appFeatureExportsNormalized ? "yes" : "no"}
            </p>
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                Protected Files Stripped
              </p>
              <DebugList
                items={debug.normalization.strippedProtectedFiles}
                emptyLabel="No protected files were removed."
              />
            </div>
          </div>
        </DebugSection>

        <DebugSection title="Request Context">
          <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">Mode</dt>
              <dd>{debug.requestContext.isRefinement ? "Refinement" : "Initial generation"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Extension point</dt>
              <dd className="font-mono break-all">
                {debug.requestContext.extensionPoint}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Features</dt>
              <dd>
                {debug.requestContext.features.length > 0
                  ? debug.requestContext.features.join(", ")
                  : "None"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Schema included</dt>
              <dd>{debug.requestContext.schemaIncluded ? "yes" : "no"}</dd>
            </div>
            {debug.requestContext.schemaIntrospectionNote && (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-foreground">Schema status</dt>
                <dd>{debug.requestContext.schemaIntrospectionNote}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-foreground">Existing files</dt>
              <dd>{debug.requestContext.existingFileCount}</dd>
            </div>
            {debug.requestContext.chatMessage && (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-foreground">Chat request</dt>
                <dd>{debug.requestContext.chatMessage}</dd>
              </div>
            )}
          </dl>
        </DebugSection>

        {debug.introspection && (
          <DebugSection
            title={`Schema Introspection (${debug.introspection.attempted ? "run" : "skipped"})`}
            defaultOpen={debug.introspection.attempted}
          >
            <div className="space-y-2 text-xs text-muted-foreground">
              {!debug.introspection.attempted && debug.introspection.reason && (
                <p>{debug.introspection.reason}</p>
              )}
              {debug.introspection.totalDurationMs != null && (
                <p>Total: {debug.introspection.totalDurationMs}ms</p>
              )}
              {debug.introspection.endpoints.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-1">
                    Endpoints
                  </p>
                  <ul className="space-y-1">
                    {debug.introspection.endpoints.map((ep) => (
                      <li key={ep.endpoint} className="font-mono">
                        <span className="font-semibold text-foreground">
                          {ep.endpoint}
                        </span>{" "}
                        — {ep.status}
                        {ep.typeCount != null && ` (${ep.typeCount} types)`}
                        {ep.durationMs != null && ` in ${ep.durationMs}ms`}
                        {ep.error && (
                          <span className="text-destructive block mt-0.5">
                            {ep.error}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DebugSection>
        )}

        {rawResponse && (
          <DebugSection title="Raw LLM Response">
            <MarkdownContent
              content={rawResponse}
              className="text-xs text-muted-foreground"
            />
          </DebugSection>
        )}
      </div>
    </div>
  );
}

// ─── FileTreeNode Component ───────────────────────────────────────────────────

function FileTreeNode({
  node,
  depth,
  selectedFile,
  expandedDirs,
  onSelectFile,
  onToggleDir,
}: {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  expandedDirs: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleDir: (path: string) => void;
}) {
  const pl = 8 + depth * 12;

  if (node.isDir) {
    const isOpen = expandedDirs.has(node.fullPath);
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggleDir(node.fullPath)}
          className="w-full text-left py-1 rounded text-xs flex items-center gap-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          style={{ paddingLeft: `${pl}px`, paddingRight: "8px" }}
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-3 w-3 flex-shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-3 w-3 flex-shrink-0 text-amber-500" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isOpen && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.fullPath}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                expandedDirs={expandedDirs}
                onSelectFile={onSelectFile}
                onToggleDir={onToggleDir}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedFile === node.fullPath;
  return (
    <button
      type="button"
      onClick={() => onSelectFile(node.fullPath)}
      className={`w-full text-left py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
        isSelected
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      style={{ paddingLeft: `${pl}px`, paddingRight: "8px" }}
    >
      {node.isGenerated ? (
        <span className="h-3 w-3 flex-shrink-0 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      ) : (
        <FileCode className="h-3 w-3 flex-shrink-0" />
      )}
      <span className="font-mono truncate">{node.name}</span>
    </button>
  );
}

// ─── Deploy Types ─────────────────────────────────────────────────────────────

type DeployState =
  | { status: "idle" }
  | { status: "deploying" }
  | { status: "building"; deploymentId: string; projectId?: string }
  | { status: "ready"; url: string; vercelDashboardUrl?: string; readyAt: number }
  | { status: "error"; message: string };

interface StoredDeploymentInfo {
  projectId?: string;
  deployUrl?: string;
  deployedVersionId?: string;
}

type PendingVersionAction =
  | {
      type: "deploy";
      version: GenerationVersion;
      closeVersionsPanel?: boolean;
    }
  | {
      type: "download";
      version: GenerationVersion;
      closeVersionsPanel?: boolean;
    }
  | {
      type: "delete";
      version: GenerationVersion;
      closeVersionsPanel?: boolean;
    };

type RightPanelMode = "refine" | "guide" | "debug";

function getDeployStorageKey(config: AppConfig): string {
  const projectName =
    `vibecore-${config.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`;
  return `vibecore-deploy-${projectName}`;
}

function readStoredDeploymentInfo(
  storageKey: string
): StoredDeploymentInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredDeploymentInfo;
    if (!parsed.projectId && !parsed.deployUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatRelativeTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

const POLL_INTERVAL = 5000;
const POLL_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// ─── GenerationView ───────────────────────────────────────────────────────────

interface GenerationViewProps {
  config: AppConfig;
  files: GeneratedFile[];
  message: string;
  debug: GenerationDebugData;
  fileChangeSource: FileChangeSource;
  settingsOverrides: AppSettingsOverrides;
  onFilesUpdated: (files: GeneratedFile[], meta?: FileUpdateMeta) => void;
  onDeleteApp?: () => void;
  onOpenSettings?: () => void;
  onStartOver: () => void;
  sdkClient?: ClientSDK;
}

export function GenerationView({
  config,
  files,
  message,
  debug,
  fileChangeSource,
  settingsOverrides,
  onFilesUpdated,
  onDeleteApp,
  onOpenSettings,
  onStartOver,
  sdkClient,
}: GenerationViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    files[0]?.path ?? null
  );
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode | null>(
    null
  );
  const [deployState, setDeployState] = useState<DeployState>({ status: "idle" });
  const [showHistory, setShowHistory] = useState(false);
  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareVersionA, setCompareVersionA] = useState<string | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<string | null>(null);
  const [pendingVersionAction, setPendingVersionAction] =
    useState<PendingVersionAction | null>(null);
  const [showDeleteAppConfirmation, setShowDeleteAppConfirmation] = useState(false);
  const [storedDeployment, setStoredDeployment] =
    useState<StoredDeploymentInfo | null>(null);
  const [historyVersions, setHistoryVersions] = useState<GenerationVersion[]>(
    () => (typeof window !== "undefined" ? getVersions(config) : [])
  );
  const [templateFileContent, setTemplateFileContent] = useState<GeneratedFile | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [versionJustSaved, setVersionJustSaved] = useState(false);
  const [autoRedeployFromConfig, setAutoRedeployFromConfig] = useState(true);
  const previousDeployStatusRef = useRef<DeployState["status"]>("idle");
  const [hasUndeployedRefinement, setHasUndeployedRefinement] = useState(false);

  // Initialize expanded dirs from all known paths (runs once)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
    const tPaths = getTemplatePaths(config.features);
    const gPaths = files.map((f) => f.path.replace(/\\/g, "/"));
    const merged = [...new Set([...tPaths, ...gPaths])];
    return getDirPaths(merged);
  });

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);
  const lastDeployedFilesRef = useRef<string>("");
  const handleDeployRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // File tree derived state
  const generatedPaths = useMemo(
    () => new Set(files.map((f) => f.path.replace(/\\/g, "/"))),
    [files]
  );
  const templatePaths = useMemo(
    () => getTemplatePaths(config.features),
    [config.features]
  );
  const allPaths = useMemo(
    () => [...new Set([...templatePaths, ...Array.from(generatedPaths)])],
    [templatePaths, generatedPaths]
  );
  const tree = useMemo(
    () => buildTree(allPaths, generatedPaths),
    [allPaths, generatedPaths]
  );

  const isTemplatePath = useMemo(
    () =>
      selectedFile != null &&
      templatePaths.includes(selectedFile) &&
      !generatedPaths.has(selectedFile),
    [selectedFile, templatePaths, generatedPaths]
  );
  const deployStorageKey = getDeployStorageKey(config);
  const hasPreviousDeployment = Boolean(
    storedDeployment?.projectId || storedDeployment?.deployUrl
  );
  const knownDeployUrl =
    deployState.status === "ready" ? deployState.url : storedDeployment?.deployUrl;
  const currentVersion = useMemo(
    () =>
      historyVersions.find(
        (version) =>
          files.length === version.files.length &&
          files.every(
            (file, index) =>
              file.path === version.files[index]?.path &&
              file.content === version.files[index]?.content
          )
      ) ?? null,
    [historyVersions, files]
  );
  const currentVersionNumber = useMemo(() => {
    if (!currentVersion) return null;
    const currentIndex = historyVersions.findIndex(
      (version) => version.id === currentVersion.id
    );
    return currentIndex >= 0 ? historyVersions.length - currentIndex : null;
  }, [historyVersions, currentVersion]);
  const canSaveVersion = files.length > 0 && currentVersion === null;
  const disableCurrentRedeploy = hasPreviousDeployment && canSaveVersion;
  const isCurrentVersionDeployed = useMemo(() => {
    if (!storedDeployment?.deployedVersionId) return false;
    if (!currentVersion) return false;
    return currentVersion.id === storedDeployment.deployedVersionId;
  }, [storedDeployment?.deployedVersionId, currentVersion]);
  const shouldGlow =
    !disableCurrentRedeploy &&
    (deployState.status === "idle"
      ? !isCurrentVersionDeployed
      : deployState.status === "ready"
        ? hasUndeployedRefinement || !isCurrentVersionDeployed
        : false);
  const canDeleteApp = Boolean(onDeleteApp) && historyVersions.length > 0;
  const toggleRightPanel = useCallback((mode: RightPanelMode) => {
    setRightPanelMode((currentMode) => (currentMode === mode ? null : mode));
  }, []);
  const closeRightPanel = useCallback(() => {
    setRightPanelMode(null);
  }, []);

  // Clear download error after 5 seconds
  useEffect(() => {
    if (!downloadError) return;
    const t = setTimeout(() => setDownloadError(null), 5000);
    return () => clearTimeout(t);
  }, [downloadError]);

  // Fetch template file content when a template file is selected
  useEffect(() => {
    if (!isTemplatePath || !selectedFile) {
      setTemplateFileContent(null);
      return;
    }
    let cancelled = false;
    setTemplateLoading(true);
    setTemplateFileContent(null);
    fetch("/api/template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selectedFile, config }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);
        return res.json();
      })
      .then((data: { path: string; content: string }) => {
        if (!cancelled) {
          setTemplateFileContent({ path: data.path, content: data.content });
        }
      })
      .catch(() => {
        if (!cancelled) setTemplateFileContent(null);
      })
      .finally(() => {
        if (!cancelled) setTemplateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isTemplatePath, selectedFile, config]);

  // Refresh history when config, files, or change source changes.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHistoryVersions(getVersions(config));
    }
  }, [config, files, fileChangeSource]);

  useEffect(() => {
    if (!versionJustSaved) return;
    const timer = setTimeout(() => setVersionJustSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [versionJustSaved]);

  useEffect(() => {
    setStoredDeployment(readStoredDeploymentInfo(deployStorageKey));
  }, [deployStorageKey]);

  // Fetch config for auto-redeploy default (env-driven)
  useEffect(() => {
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { autoRedeployOnRefinement?: boolean } | null) => {
        if (data && typeof data.autoRedeployOnRefinement === "boolean") {
          setAutoRedeployFromConfig(data.autoRedeployOnRefinement);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-redeploy only after true app modifications on an existing deploy.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = getDeployStorageKey(config);
    let projectId: string | undefined;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { projectId?: string };
        projectId = parsed.projectId;
      }
    } catch {
      /* ignore */
    }
    if (!projectId) return; // First deploy is manual
    if (
      deployState.status === "deploying" ||
      deployState.status === "building"
    ) {
      return;
    }
    const override = settingsOverrides.AUTO_REDEPLOY_ON_REFINEMENT;
    const autoRedeployEnabled =
      override === "false"
        ? false
        : override === "true"
          ? true
          : autoRedeployFromConfig;
    if (!autoRedeployEnabled) return;
    const filesSig = JSON.stringify(
      files.map((f) => `${f.path}:${simpleHash(f.content)}`).sort()
    );
    // Prime on first run (avoid deploy on mount)
    if (lastDeployedFilesRef.current === "") {
      lastDeployedFilesRef.current = filesSig;
      return;
    }
    if (filesSig === lastDeployedFilesRef.current) return;
    lastDeployedFilesRef.current = filesSig;
    if (currentVersion === null) return;
    if (fileChangeSource !== "refinement") return;
    const t = setTimeout(() => {
      handleDeployRef.current();
    }, 500);
    return () => clearTimeout(t);
  }, [
    config,
    files,
    deployState.status,
    fileChangeSource,
    currentVersion,
    settingsOverrides.AUTO_REDEPLOY_ON_REFINEMENT,
    autoRedeployFromConfig,
  ]);

  // Expand any newly added dirs when files are updated via chat
  useEffect(() => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      for (const p of allPaths) {
        const parts = p.split("/");
        for (let i = 1; i < parts.length; i++) {
          next.add(parts.slice(0, i).join("/"));
        }
      }
      return next;
    });
  }, [allPaths]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Auto-open the Install Guide panel when a deployment finishes successfully.
  useEffect(() => {
    if (
      deployState.status === "ready" &&
      previousDeployStatusRef.current !== "ready"
    ) {
      setRightPanelMode("guide");
    }

    previousDeployStatusRef.current = deployState.status;
  }, [deployState.status]);

  // Dismiss the deploy status bar when a refinement begins processing.
  useEffect(() => {
    if (regenerating && deployState.status === "ready") {
      setDeployState({ status: "idle" });
      setHasUndeployedRefinement(true);
    }
  }, [regenerating, deployState.status]);

  // Track undeployed refinement state from file change source.
  useEffect(() => {
    if (fileChangeSource === "refinement") {
      setHasUndeployedRefinement(true);
    }
  }, [fileChangeSource]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (
      deploymentId: string,
      projectId: string | undefined,
      storageKey: string,
      versionId?: string
    ) => {
      pollStartRef.current = Date.now();

      pollTimerRef.current = setInterval(async () => {
        if (Date.now() - pollStartRef.current > POLL_TIMEOUT) {
          stopPolling();
          setDeployState({
            status: "error",
            message:
              "Deployment timed out after 5 minutes. Check the Vercel dashboard.",
          });
          return;
        }

        try {
          const res = await fetch(`/api/deployments/${deploymentId}`, {
            headers: settingsOverrides.VERCEL_TOKEN
              ? { "x-vibecore-vercel-token": settingsOverrides.VERCEL_TOKEN }
              : undefined,
          });
          if (!res.ok) throw new Error("Failed to check status");

          const data = await res.json();

          if (data.readyState === "READY") {
            stopPolling();
            const rawUrl =
              data.alias?.[0] ?? data.url ?? `${deploymentId}.vercel.app`;
            const url = rawUrl.startsWith("https://")
              ? rawUrl
              : `https://${rawUrl}`;
            if (projectId && typeof window !== "undefined") {
              const nextStoredDeployment: StoredDeploymentInfo = {
                projectId,
                deployUrl: url,
                ...(versionId && { deployedVersionId: versionId }),
              };
              try {
                localStorage.setItem(
                  storageKey,
                  JSON.stringify(nextStoredDeployment)
                );
                setStoredDeployment(nextStoredDeployment);
              } catch {
                /* ignore */
              }
            }
            setDeployState({
              status: "ready",
              url,
              vercelDashboardUrl: data.inspectorUrl ?? undefined,
              readyAt: Date.now(),
            });
          } else if (
            data.readyState === "ERROR" ||
            data.readyState === "CANCELED"
          ) {
            stopPolling();
            setDeployState({
              status: "error",
              message: `Deployment ${data.readyState.toLowerCase()}. Check the Vercel dashboard for build logs.`,
            });
          }
          // else: still BUILDING/QUEUED — keep polling
        } catch {
          // Tolerate transient fetch errors; keep polling
        }
      }, POLL_INTERVAL);
    },
    [settingsOverrides.VERCEL_TOKEN, stopPolling]
  );

  const deployWithConfigAndFiles = useCallback(
    async (
      deployConfig: AppConfig,
      deployFiles: GeneratedFile[],
      versionId?: string
    ) => {
      setDeployState({ status: "deploying" });
      setHasUndeployedRefinement(false);

      const storageKey = getDeployStorageKey(deployConfig);
      let projectId: string | undefined;
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored) as {
              projectId?: string;
              deployUrl?: string;
            };
            projectId = parsed.projectId;
          }
        } catch {
          /* ignore */
        }
      }

      try {
        const res = await fetch("/api/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: deployConfig,
            files: deployFiles,
            settings: settingsOverrides,
            ...(projectId && { projectId }),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            (errData as { error?: string }).error ||
              `Deploy failed (${res.status})`
          );
        }

        const data: {
          deploymentId: string;
          projectId?: string;
          url: string | null;
          readyState: string;
          inspectorUrl?: string | null;
        } = await res.json();

        const resolvedProjectId = data.projectId ?? projectId;
        const rawUrl =
          data.url ??
          (data.deploymentId ? `${data.deploymentId}.vercel.app` : null);
        const deployUrl = rawUrl
          ? rawUrl.startsWith("https://")
            ? rawUrl
            : `https://${rawUrl}`
          : null;

        if (data.readyState === "READY" && deployUrl) {
          if (resolvedProjectId && typeof window !== "undefined") {
            const nextStoredDeployment: StoredDeploymentInfo = {
              projectId: resolvedProjectId,
              deployUrl,
              ...(versionId && { deployedVersionId: versionId }),
            };
            try {
              localStorage.setItem(
                storageKey,
                JSON.stringify(nextStoredDeployment)
              );
              setStoredDeployment(nextStoredDeployment);
            } catch {
              /* ignore */
            }
          }
          setDeployState({
            status: "ready",
            url: deployUrl,
            vercelDashboardUrl: data.inspectorUrl ?? undefined,
            readyAt: Date.now(),
          });
        } else {
          setDeployState({
            status: "building",
            deploymentId: data.deploymentId,
            projectId: resolvedProjectId,
          });
          startPolling(
            data.deploymentId,
            resolvedProjectId,
            storageKey,
            versionId
          );
        }
      } catch (err) {
        setDeployState({
          status: "error",
          message: err instanceof Error ? err.message : "Deploy failed",
        });
      }
    },
    [settingsOverrides, startPolling]
  );

  const handleDeploy = useCallback(() => {
    deployWithConfigAndFiles(config, files, currentVersion?.id);
  }, [config, files, currentVersion?.id, deployWithConfigAndFiles]);

  const handleDeployVersion = useCallback(
    (version: GenerationVersion) => {
      deployWithConfigAndFiles(version.config, version.files, version.id);
    },
    [deployWithConfigAndFiles]
  );

  handleDeployRef.current = () =>
    deployWithConfigAndFiles(config, files, currentVersion?.id);

  const performDownload = useCallback(
    async (
      cfg: AppConfig,
      fls: GeneratedFile[],
      filenameSuffix?: string
    ): Promise<void> => {
      setDownloadError(null);
      setDownloading(true);
      const downloadWindow = openPreparedZipWindow(
        filenameSuffix !== undefined
          ? `${cfg.appName}-${filenameSuffix}.zip`
          : `${cfg.appName}.zip`
      );
      try {
        const prepared = await prepareZipDownload(cfg, fls, filenameSuffix);
        await openPreparedZipDownload(prepared, downloadWindow, sdkClient);
      } catch (err) {
        if (downloadWindow && !downloadWindow.closed) {
          downloadWindow.close();
        }
        const msg =
          err instanceof Error ? err.message : "Download failed";
        setDownloadError(msg);
        console.error("Download failed:", err);
      } finally {
        setDownloading(false);
      }
    },
    [sdkClient]
  );
  const handleSaveFile = useCallback(
    (updatedFile: GeneratedFile) => {
      const normalizedPath = updatedFile.path.replace(/\\/g, "/");
      const nextFiles = [...files];
      const existingIndex = nextFiles.findIndex(
        (file) => file.path.replace(/\\/g, "/") === normalizedPath
      );

      if (existingIndex >= 0) {
        nextFiles[existingIndex] = updatedFile;
      } else {
        nextFiles.push(updatedFile);
      }

      setVersionJustSaved(false);
      onFilesUpdated(nextFiles, { changeSource: "manual-edit" });
    },
    [files, onFilesUpdated]
  );
  const handleSaveCurrentVersion = useCallback(() => {
    if (!canSaveVersion) return;

    saveVersion(config, files, message, undefined, debug);
    setHistoryVersions(getVersions(config));
    setVersionJustSaved(true);
    onFilesUpdated(files, { changeSource: "manual-version-save" });
  }, [canSaveVersion, config, files, message, debug, onFilesUpdated]);
  const requestVersionAction = useCallback((action: PendingVersionAction) => {
    setPendingVersionAction(action);
  }, []);

  const closeVersionActionConfirmation = useCallback(() => {
    setPendingVersionAction(null);
  }, []);

  const handleDownload = useCallback(
    () => {
      void performDownload(
        config,
        files,
        currentVersion ? `v${currentVersion.id.slice(0, 8)}` : undefined
      );
    },
    [performDownload, config, files, currentVersion]
  );

  const handleToggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleViewVersion = useCallback(
    (version: GenerationVersion) => {
      onFilesUpdated(version.files, {
        changeSource: "view-version",
        message: version.message,
        debug: version.debug ?? undefined,
      });
    },
    [onFilesUpdated]
  );

  const handleDownloadVersion = useCallback(
    (version: GenerationVersion) => {
      void performDownload(
        version.config,
        version.files,
        `v${version.id.slice(0, 8)}`
      );
    },
    [performDownload]
  );

  const handleDeleteVersion = useCallback(
    (version: GenerationVersion) => {
      deleteVersion(config, version.id);
      setHistoryVersions(getVersions(config));
      // If we deleted the current view, switch to previous or stay
      const isCurrent =
        files.length === version.files.length &&
        files.every(
          (f, i) =>
            f.path === version.files[i]?.path &&
            f.content === version.files[i]?.content
        );
      if (isCurrent && historyVersions.length > 1) {
        const next = historyVersions.find((v) => v.id !== version.id);
        if (next) {
          onFilesUpdated(next.files, { changeSource: "delete-fallback" });
        }
      }
    },
    [config, files, historyVersions, onFilesUpdated]
  );

  const confirmVersionAction = useCallback(() => {
    if (!pendingVersionAction) return;

    if (pendingVersionAction.closeVersionsPanel) {
      setShowVersionsPanel(false);
    }

    switch (pendingVersionAction.type) {
      case "deploy":
        handleDeployVersion(pendingVersionAction.version);
        break;
      case "download":
        handleDownloadVersion(pendingVersionAction.version);
        break;
      case "delete":
        handleDeleteVersion(pendingVersionAction.version);
        break;
    }

    setPendingVersionAction(null);
  }, [
    pendingVersionAction,
    handleDeleteVersion,
    handleDeployVersion,
    handleDownloadVersion,
  ]);

  const pendingVersionActionCopy = useMemo(() => {
    if (!pendingVersionAction) return null;

    switch (pendingVersionAction.type) {
      case "deploy":
        return {
          title: `${hasPreviousDeployment ? "Redeploy" : "Deploy"} previous version`,
          description: hasPreviousDeployment
            ? "This will redeploy your Vercel app using the selected saved version."
            : "This will deploy the selected saved version to Vercel.",
          confirmLabel: `${hasPreviousDeployment ? "Redeploy" : "Deploy"} version`,
          confirmVariant: "default" as const,
          confirmColorScheme: "primary" as const,
        };
      case "download":
        return {
          title: "Download previous version ZIP",
          description:
            "This will generate a ZIP download for the selected saved version.",
          confirmLabel: "Download ZIP",
          confirmVariant: "default" as const,
          confirmColorScheme: "primary" as const,
        };
      case "delete":
        return {
          title: "Delete previous version",
          description:
            "This will permanently remove the selected saved version from local history. This action cannot be undone.",
          confirmLabel: "Delete version",
          confirmVariant: "outline" as const,
          confirmColorScheme: "danger" as const,
        };
    }
  }, [pendingVersionAction, hasPreviousDeployment]);

  const deleteAppCopy = useMemo(() => {
    if (!canDeleteApp) return null;
    return {
      title: "Delete app history",
      description: `Delete all saved history for ${config.appName}?`,
      summary: `This will permanently remove ${historyVersions.length} saved version${
        historyVersions.length === 1 ? "" : "s"
      } for this app from local history on this device.`,
    };
  }, [canDeleteApp, config.appName, historyVersions.length]);

  const confirmDeleteApp = useCallback(() => {
    if (!onDeleteApp) return;
    setShowDeleteAppConfirmation(false);
    onDeleteApp();
  }, [onDeleteApp]);

  const currentFile = files.find(
    (f) => f.path.replace(/\\/g, "/") === selectedFile
  );
  const selectedIsTemplate =
    selectedFile != null && templatePaths.includes(selectedFile);

  const versionA = compareVersionA
    ? historyVersions.find((v) => v.id === compareVersionA) ?? null
    : null;
  const versionB = compareVersionB
    ? historyVersions.find((v) => v.id === compareVersionB) ?? null
    : null;

  return (
    <>
      {regenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="text-center space-y-6 max-w-sm w-full p-6">
            <GeneratingLoadingContent
              title={`Refining ${config.appName}`}
              subtitle="Applying your changes..."
            />
          </div>
        </div>
      )}
      {showCompare && versionA && versionB && compareVersionA && compareVersionB && (
        <VersionDiffView
          versionA={versionA}
          versionB={versionB}
          allVersions={historyVersions}
          selectedIdA={compareVersionA}
          selectedIdB={compareVersionB}
          onSelectA={setCompareVersionA}
          onSelectB={setCompareVersionB}
          onClose={() => {
            setShowCompare(false);
            setCompareVersionA(null);
            setCompareVersionB(null);
          }}
        />
      )}
      {pendingVersionAction && pendingVersionActionCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          aria-modal="true"
          role="dialog"
          aria-label={pendingVersionActionCopy.title}
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeVersionActionConfirmation}
            aria-label="Close confirmation dialog"
          />
          <div
            className="relative z-10 w-full max-w-md rounded-lg border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-muted p-2">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold">
                    {pendingVersionActionCopy.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {pendingVersionActionCopy.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={closeVersionActionConfirmation}
              >
                Cancel
              </Button>
              <Button
                variant={pendingVersionActionCopy.confirmVariant}
                size="sm"
                colorScheme={pendingVersionActionCopy.confirmColorScheme}
                onClick={confirmVersionAction}
              >
                {pendingVersionActionCopy.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAppConfirmation && deleteAppCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          aria-modal="true"
          role="dialog"
          aria-label={deleteAppCopy.title}
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setShowDeleteAppConfirmation(false)}
            aria-label="Close delete app dialog"
          />
          <div
            className="relative z-10 w-full max-w-md rounded-lg border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold">{deleteAppCopy.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {deleteAppCopy.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3 border-b px-5 py-4 text-sm text-muted-foreground">
              <p>{deleteAppCopy.summary}</p>
              <p>
                This does not remove any deployed Vercel app, but it clears the full
                saved review history for this app from this browser.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteAppConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                colorScheme="danger"
                onClick={confirmDeleteApp}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete App
              </Button>
            </div>
          </div>
        </div>
      )}
      {showVersionsPanel && (
        <div
          className="fixed inset-0 z-40"
          aria-modal="true"
          role="dialog"
          aria-label="Version history"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowVersionsPanel(false)}
            aria-label="Close versions panel"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-98 max-w-[90vw] bg-card border-l shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Version History ({historyVersions.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowVersionsPanel(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {historyVersions.length >= 2 && (
              <div className="flex-shrink-0 px-4 py-2 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => {
                    setCompareVersionA(historyVersions[1].id);
                    setCompareVersionB(historyVersions[0].id);
                    setShowVersionsPanel(false);
                    setShowCompare(true);
                  }}
                >
                  <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                  Compare versions
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyVersions.map((v, index) => (
                <div
                  key={v.id}
                  className="rounded-lg border bg-background p-3 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground flex items-center gap-2">
                        Version {historyVersions.length - index} of {historyVersions.length}
                        {v.id === storedDeployment?.deployedVersionId && (
                          <Badge
                            colorScheme="success"
                            size="sm"
                            variant="default"
                            className="text-[10px] h-5 px-1.5"
                          >
                            LIVE
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(v.timestamp)}
                      </p>
                    </div>
                    {v.chatSummary && (
                      <span
                        className="truncate text-muted-foreground max-w-[140px] text-xs"
                        title={v.chatSummary}
                      >
                        {v.chatSummary}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        handleViewVersion(v);
                        setShowVersionsPanel(false);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        requestVersionAction({
                          type: "deploy",
                          version: v,
                          closeVersionsPanel: true,
                        });
                      }}
                      disabled={
                        deployState.status === "deploying" ||
                        deployState.status === "building"
                      }
                    >
                      <Rocket className="h-3 w-3 mr-1" />
                      {hasPreviousDeployment ? "Redeploy" : "Deploy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() =>
                        requestVersionAction({
                          type: "download",
                          version: v,
                        })
                      }
                      disabled={downloading}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() =>
                        requestVersionAction({
                          type: "delete",
                          version: v,
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartOver}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
              {config.appName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentVersionNumber && historyVersions.length > 0
                  ? `Version ${currentVersionNumber} of ${historyVersions.length}`
                  : ``}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRightPanel("refine")}
                aria-pressed={rightPanelMode === "refine"}
                className={`h-8 ${
                  rightPanelMode === "refine" ? "bg-primary/10 text-primary" : ""
                }`}
                title="Open refine panel"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Refine
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRightPanel("guide")}
                aria-pressed={rightPanelMode === "guide"}
                className={`h-8 ${
                  rightPanelMode === "guide" ? "bg-primary/10 text-primary" : ""
                }`}
                title="Open install guide"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                Guide
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRightPanel("debug")}
                aria-pressed={rightPanelMode === "debug"}
                className={`h-8 ${
                  rightPanelMode === "debug" ? "bg-primary/10 text-primary" : ""
                }`}
                title="Open debug output"
              >
                <Bug className="h-3.5 w-3.5 mr-1" />
                Debug
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-1">
              {historyVersions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersionsPanel(true)}
                  className="h-8"
                  title="Open version history"
                >
                  <History className="h-3.5 w-3.5 mr-1" />
                  Versions ({historyVersions.length})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveCurrentVersion}
                disabled={!canSaveVersion}
                className={`h-8 ${
                  canSaveVersion ? "" : "text-muted-foreground"
                }`}
                title={
                  canSaveVersion
                    ? "Save the current working copy as a new version"
                    : "No unsaved file changes to snapshot"
                }
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {versionJustSaved ? "Saved" : "Save Version"}
              </Button>
              {canDeleteApp && (
                <Button
                  variant="ghost"
                  size="sm"
                  colorScheme="danger"
                  onClick={() => setShowDeleteAppConfirmation(true)}
                  className="h-8"
                  title="Delete this app and its saved local history"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete App
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {downloading ? "Preparing..." : "Download App"}
              </Button>
              <DeployButton
                state={deployState}
                onDeploy={handleDeploy}
                hasPreviousDeployment={hasPreviousDeployment}
                postRefinement={hasUndeployedRefinement}
                disabled={disableCurrentRedeploy}
                shouldGlow={shouldGlow}
              />
            </div>
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSettings}
                className="h-8"
                title="Open settings"
              >
                <Settings className="h-3.5 w-3.5 mr-1" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {downloadError && (
        <div className="flex-shrink-0 px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive">
          Download failed: {downloadError}
        </div>
      )}

      {/* Deploy status bar */}
      <DeployStatusBar state={deployState} versionNumber={currentVersionNumber} />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-64 flex-shrink-0 border-r bg-muted/30 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-2">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Files
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  <span>generated</span>
                </div>
              </div>
              {tree.map((node) => (
                <FileTreeNode
                  key={node.fullPath}
                  node={node}
                  depth={0}
                  selectedFile={selectedFile}
                  expandedDirs={expandedDirs}
                  onSelectFile={setSelectedFile}
                  onToggleDir={handleToggleDir}
                />
              ))}
            </div>
          </div>

          {/* History panel */}
          {historyVersions.length > 0 && (
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex-shrink-0">
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex-1 px-2 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    History ({historyVersions.length})
                  </span>
                  {showHistory ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {historyVersions.length >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] shrink-0"
                    onClick={() => {
                      setCompareVersionA(historyVersions[1].id);
                      setCompareVersionB(historyVersions[0].id);
                      setShowCompare(true);
                    }}
                  >
                    <GitCompare className="h-2.5 w-2.5 mr-1" />
                    Compare
                  </Button>
                )}
              </div>
              {showHistory && (
                <div className="px-2 pb-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {historyVersions.map((v) => (
                    <div
                      key={v.id}
                      className="rounded border bg-background p-2 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground truncate flex items-center gap-1.5">
                          {formatRelativeTime(v.timestamp)}
                          {v.id === storedDeployment?.deployedVersionId && (
                            <Badge
                              colorScheme="success"
                              size="sm"
                              variant="default"
                              className="text-[9px] h-4 px-1"
                            >
                              LIVE
                            </Badge>
                          )}
                        </span>
                        {v.chatSummary && (
                          <span
                            className="truncate text-muted-foreground max-w-[100px]"
                            title={v.chatSummary}
                          >
                            {v.chatSummary}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleViewVersion(v)}
                        >
                          <Eye className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() =>
                            requestVersionAction({
                              type: "deploy",
                              version: v,
                            })
                          }
                          disabled={
                            deployState.status === "deploying" ||
                            deployState.status === "building"
                          }
                          title={
                            hasPreviousDeployment
                              ? "Redeploy this version to Vercel"
                              : "Deploy this version to Vercel"
                          }
                        >
                          <Rocket className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() =>
                            requestVersionAction({
                              type: "download",
                              version: v,
                            })
                          }
                          disabled={downloading}
                        >
                          <Download className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                          onClick={() =>
                            requestVersionAction({
                              type: "delete",
                              version: v,
                            })
                          }
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-y-auto pt-4 min-w-0">
          {currentFile ? (
            <CodeFileViewer
              file={currentFile}
              isTemplate={selectedIsTemplate}
              onSave={handleSaveFile}
            />
          ) : isTemplatePath && templateFileContent ? (
            <CodeFileViewer
              file={templateFileContent}
              isTemplate
              onSave={handleSaveFile}
            />
          ) : isTemplatePath && templateLoading ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted border-b">
                <span className="text-xs font-mono text-muted-foreground">
                  {selectedFile}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ) : selectedFile && isTemplatePath ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileCode className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Template file
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                Could not load template content. It will be included in your
                downloaded ZIP or Vercel deployment.
              </p>
            </div>
          ) : selectedFile ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileCode className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Template file
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                This file is managed by the Vibecore template. Its content is
                always up-to-date in your downloaded ZIP or Vercel deployment.
              </p>
            </div>
          ) : null}
        </div>

        {rightPanelMode && (
          <div className="w-[550px] max-w-[40vw] flex-shrink-0 border-l bg-muted/20 min-h-0 flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {rightPanelMode === "refine"
                    ? "Refine App"
                    : rightPanelMode === "guide"
                    ? "Install Guide"
                    : "Debug Output"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rightPanelMode === "refine"
                    ? "Describe changes and update the current files"
                    : rightPanelMode === "guide"
                    ? "App Studio setup and deployment steps"
                    : "Inspect the latest generation and validation details"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={closeRightPanel}
                title="Collapse side panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 p-4">
              {rightPanelMode === "refine" ? (
                <ChatRefinement
                  config={config}
                  files={files}
                  settingsOverrides={settingsOverrides}
                  onFilesUpdated={onFilesUpdated}
                  onRegeneratingChange={setRegenerating}
                  embedded
                />
              ) : rightPanelMode === "guide" ? (
                <div className="h-full overflow-y-auto">
                  <InstallGuide
                    config={config}
                    deployUrl={
                      deployState.status === "ready" ? deployState.url : undefined
                    }
                    knownDeployUrl={knownDeployUrl}
                    hasPreviousDeployment={hasPreviousDeployment}
                    vercelDashboardUrl={
                      deployState.status === "ready"
                        ? deployState.vercelDashboardUrl
                        : undefined
                    }
                    embedded
                  />
                </div>
              ) : (
                <DebugOutputPanel message={message} debug={debug} embedded />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 border-t px-4 py-1 flex justify-center">
        <span className="text-[10px] text-muted-foreground/50 select-none">
          Vibecore Studio · 2026 Sitecore Hackathon · Team Sitecorepunk2077
        </span>
      </div>
    </div>
    </>
  );
}

// ─── Deploy Button ────────────────────────────────────────────────────────────

function DeployButton({
  state,
  onDeploy,
  hasPreviousDeployment,
  postRefinement = false,
  disabled = false,
  shouldGlow = false,
}: {
  state: DeployState;
  onDeploy: () => void;
  hasPreviousDeployment: boolean;
  postRefinement?: boolean;
  disabled?: boolean;
  shouldGlow?: boolean;
}) {
  const disabledTitle = disabled
    ? "Save Version before redeploying to Vercel"
    : undefined;

  const redeployLabel =
    hasPreviousDeployment && postRefinement
      ? "Deploy Latest"
      : hasPreviousDeployment
        ? "Redeploy to Vercel"
        : "Deploy to Vercel";

  if (state.status === "deploying" || state.status === "building") {
    return (
      <Button size="sm" disabled variant="ghost" className="h-8">
        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
        {state.status === "deploying" ? "Deploying..." : "Building..."}
      </Button>
    );
  }

  if (state.status === "ready") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8"
          onClick={() => window.open(state.url, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Open App
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDeploy}
          disabled={disabled}
          title={disabledTitle}
          className={cn(
            "h-8",
            shouldGlow && "animate-breathe hover:animate-none focus:animate-none"
          )}
        >
          <Rocket className="h-3.5 w-3.5 mr-1" />
          {redeployLabel}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onDeploy}
      disabled={disabled}
      title={disabledTitle}
      className={cn(
        "h-8",
        shouldGlow && "animate-breathe hover:animate-none focus:animate-none"
      )}
    >
      <Rocket className="h-3.5 w-3.5 mr-1" />
      {redeployLabel}
    </Button>
  );
}

// ─── Deploy Status Bar ────────────────────────────────────────────────────────

function DeployStatusBar({
  state,
  versionNumber,
}: {
  state: DeployState;
  versionNumber?: number | null;
}) {
  if (state.status === "idle") return null;

  return (
    <div
      className={`flex-shrink-0 px-4 py-2 text-xs flex items-center gap-2 border-b ${
        state.status === "ready"
          ? "bg-green-50 text-green-800 border-green-200"
          : state.status === "error"
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-blue-50 text-blue-800 border-blue-200"
      }`}
    >
      {state.status === "deploying" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Sending files to Vercel...</span>
        </>
      )}
      {state.status === "building" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>
            Building on Vercel...
          </span>
        </>
      )}
      {state.status === "ready" && (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>
            Deployed successfully
            {versionNumber ? ` (v${versionNumber})` : ""}
            {" · "}
            {new Date(state.readyAt).toLocaleTimeString()}
          </span>
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium ml-1"
          >
            {state.url}
          </a>
        </>
      )}
      {state.status === "error" && (
        <>
          <XCircle className="h-3 w-3" />
          <span>{state.message}</span>
        </>
      )}
    </div>
  );
}

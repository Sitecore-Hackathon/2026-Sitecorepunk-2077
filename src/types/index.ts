export type ExtensionPointType =
  | "standalone"
  | "xmc:pages:contextpanel"
  | "xmc:pages:customfield"
  | "xmc:dashboardblocks"
  | "xmc:fullscreen";

export interface ExtensionPointConfig {
  id: ExtensionPointType;
  label: string;
  description: string;
  icon: string;
}

export type AppFeature =
  | "page-context"
  | "graphql-read"
  | "graphql-write"
  | "external-api"
  | "live-content";

export interface AppFeatureConfig {
  id: AppFeature;
  label: string;
  description: string;
  autoEnabled?: ExtensionPointType[];
}

export interface AppConfig {
  extensionPoint: ExtensionPointType;
  appName: string;
  description: string;
  features: AppFeature[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationDebugGeneratedFiles {
  count: number;
  paths: string[];
  added: string[];
  updated: string[];
  unchanged: string[];
}

export interface GenerationDebugValidation {
  errors: string[];
  warnings: string[];
}

export interface GenerationDebugFixup {
  attempted: boolean;
  reason?: string;
  errorsBefore: string[];
  errorsAfter: string[];
  failed: boolean;
  failureMessage?: string;
}

export interface GenerationDebugNormalization {
  strippedProtectedFiles: string[];
  appFeatureExportsNormalized: boolean;
}

export interface GenerationDebugRequestContext {
  isRefinement: boolean;
  extensionPoint: ExtensionPointType;
  features: AppFeature[];
  existingFileCount: number;
  chatMessage?: string;
}

export interface GenerationDebugData {
  assistantSummary: string;
  rawAssistantResponse?: string;
  generatedFiles: GenerationDebugGeneratedFiles;
  validation: GenerationDebugValidation;
  fixup: GenerationDebugFixup;
  normalization: GenerationDebugNormalization;
  requestContext: GenerationDebugRequestContext;
}

export type FileChangeSource =
  | "initial-load"
  | "refinement"
  | "manual-edit"
  | "manual-version-save"
  | "view-version"
  | "delete-fallback";

export interface FileUpdateMeta {
  message?: string;
  chatSummary?: string;
  debug?: GenerationDebugData;
  changeSource?: FileChangeSource;
}

export interface GenerationResult {
  files: GeneratedFile[];
  message: string;
  debug?: GenerationDebugData;
}

export interface GenerationVersion {
  id: string;
  files: GeneratedFile[];
  config: AppConfig;
  message: string;
  debug?: GenerationDebugData;
  timestamp: number;
  chatSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type WizardStep = "type" | "details" | "features";

export type AppPhase = "wizard" | "generating" | "review";

// ─── GraphQL Query Manifest (prompt-based templates) ───────────────────────────

export interface ManifestEntry {
  id: string;
  endpoint:
    | "xmc.authoring.graphql"
    | "xmc.live.graphql"
    | "xmc.preview.graphql";
  contextType: "preview" | "live";
  description: string;
  query: string;
  variableTypes: Record<string, string>;
}

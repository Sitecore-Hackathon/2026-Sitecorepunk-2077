# Vibecore Studio - An Intelligent Sitecore Marketplace App Builder

Go from idea to a fully functional Sitecore Marketplace app within minutes. **Vibecore Studio** is an AI-powered development tool that turns plain-language descriptions into complete, production-ready Next.js projects with the Sitecore Marketplace SDK, Blok design system, and best-practice patterns already wired in.

No boilerplate. No guesswork. Just describe what you want, deploy to Vercel, and install it in Sitecore App Studio.

## Features

### Guided 3-Step Wizard
Walk through a streamlined builder experience: pick your extension point, describe your app, and choose the capabilities you need. An optional AI enhancement step refines your name and description before generation begins.

### All 5 Extension Points Supported
Generate apps for every Sitecore surface:
- **Standalone** - Full apps in Cloud Portal
- **Context Panel** - Side panels in the SitecoreAI Pages editor
- **Custom Field** - Custom field types with `setValue`/`closeApp` patterns
- **Dashboard Widget** - Compact widgets for the SitecoreAI dashboard
- **Full Screen** - Full-screen overlays inside SitecoreAI

### Feature-Aware Code Generation
Select the capabilities your app needs and **Vibecore Studio** injects the right SDK patterns:
- **Page Context Subscription** - Live updates when users navigate between pages
- **Authoring GraphQL (Read)** - Query items, fields, and the content tree
- **Authoring GraphQL (Write)** - Create, update, and delete content items
- **Experience Edge** - Read live/published content via Edge GraphQL
- **External API Integration** - Server-side API routes with proper secret management

### GraphQL Safety Rules
GraphQL safety rules and pre-validated mutation templates are injected into the prompt so the AI follows correct Sitecore GraphQL patterns. Six mandatory safety rules prevent the AI from inventing fields, types, or arguments that don't exist in the Sitecore schema. When running in demo mode (outside Sitecore), conservative fallback rules limit the AI to well-known Authoring API fields and generate TODO comments for unverifiable queries.

### One-Click Vercel Deployment
Deploy generated apps directly to Vercel from the review screen. **Vibecore Studio** uses the Vercel Deployments API to push your app live, polls for build status in real-time, and gives you a preview URL the moment it's ready. No CLI, no git push needed.

### Iterative Refinement via Chat
Not quite right? Use the built-in chat to ask for changes: "add a search bar", "show page counts per site", "switch to a table layout". An optional AI enhance step can refine your chat prompt before sending. **Vibecore Studio** updates the generated files in place and you can re-deploy immediately.

### Inline File Editing
Edit any generated file directly in the review screen with syntax highlighting. Changes are tracked and can be saved as new versions.

### Version History & Diff View
Every generation and refinement is automatically saved as a version in localStorage (up to 20 versions per app). Browse your version history, compare changes between versions with a side-by-side diff view, and restore any previous state.

### Previous Apps
Reopen any previously generated app from the sidebar. Apps are stored by name in localStorage and persist across sessions.

### Debug Panel
Inspect the full generation pipeline for any version: validation errors and warnings, auto-repair attempts, normalization steps, protected file stripping, request context, and the raw AI response. Accessible via the bug icon in the review toolbar.

### Settings Panel
Configure API keys and tokens directly in the browser without `.env.local` files. Settings are obfuscated in localStorage and are only used when the corresponding server environment variable is missing.

### Production-Ready Output
Every generated app follows the same patterns used by Sitecore's own reference implementations:
- Singleton SDK initialization with retry logic and race condition protection
- Three-tier error handling (SDK, API, UI) with error boundaries
- Proper GraphQL query/mutation patterns for Authoring, Preview, and Experience Edge APIs
- Service layer architecture for clean separation of concerns
- TypeScript strict mode with proper type definitions
- Sitecore Blok (shadcn/ui) design system components

### Works Anywhere
Run **Vibecore Studio** as a Sitecore Marketplace standalone extension inside Cloud Portal, or use it in standalone demo mode at `localhost:3000`. A "Demo Mode" badge appears when running outside Sitecore. No Sitecore connection is required for generation.

## Quick Start

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Vercel token](https://vercel.com/account/tokens) (optional, for one-click deployment)

### Setup

```bash
npm install
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
VERCEL_TOKEN=your-vercel-token          # Optional: enables Deploy to Vercel
```

If you prefer not to keep local development secrets in `.env.local`, use the in-app `Settings` panel to save device-local override values. Real env vars still win whenever they are configured on the server.

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building.

### Running Inside SitecoreAI

1. Go to [Sitecore Cloud Portal](https://portal.sitecorecloud.io) > Apps
2. Create a custom app with extension point: **Standalone**
3. Set deployment URL to `http://localhost:3000` (or your Vercel URL)
4. Install in your environment
5. Open **Vibecore Studio** from Cloud Portal and start generating apps

## Architecture

### Application Flow

```
Wizard (3 steps) --> Generation --> Validation --> Review & Chat --> Deploy / Download
                         |                            |
                    Claude API              Iterative refinement
                   (multi-pass)            (chat-driven updates)
                         |                            |
                  Safety rules &               Version history
                  mutation templates            (auto-saved)
```

**Phase 1: Wizard** - Three guided steps collect extension point, app details, and feature selections. An optional AI enhance step refines the description.

**Phase 2: Generation** - The `/api/generate` endpoint sends a carefully engineered prompt to Claude, extracts generated files from the response, validates imports and structure, and auto-fixes errors in a repair pass if needed. GraphQL safety rules and mutation templates are injected into the prompt.

**Phase 3: Review** - A split-pane UI shows all generated files with syntax highlighting, inline editing, a built-in chat for refinement, debug information, version history with diff view, and action buttons for deployment and download.

**Phase 4: Deploy** - One-click deployment to Vercel via the Deployments API, with real-time build status polling.

### Solidified Scaffolding Architecture

**Vibecore Studio** uses a "solidified scaffolding" pattern to ensure generated apps always build successfully. The template owns all structural files (SDK initialization, error handling, routing). The AI generates only feature code at a single entry point:

```
Template (locked, never AI-generated):
  app/page.tsx --> MarketplaceApp.tsx --> imports { AppFeature }

AI-Generated (single entry point):
  components/AppFeature.tsx  <-- ALL feature code lives here
  types/index.ts             <-- Domain type definitions
  services/[Feature]Service  <-- Business logic (optional)
  app/api/[feature]/route    <-- Server routes (optional)
```

**Key design decisions:**
- `MarketplaceApp.tsx` handles all SDK initialization, loading, and error states, then renders `<AppFeature client={client} />`
- The AI generates `AppFeature.tsx` with a strict contract: `export function AppFeature({ client }: { client: ClientSDK })`
- Post-processing normalizes exports automatically (adds missing named/default exports)
- A protected file list prevents the AI from ever overriding structural files

### Protected File System

**At generation time only:** A protected file list (defined in `lib/templates.ts` as `PROTECTED_TEMPLATE_PATHS`) prevents the AI from ever overriding structural files. The `filterProtectedFiles()` step strips any LLM-generated output that matches these paths before validation.

| Category | Protected Paths |
|----------|-----------------|
| Entry & Layout | `app/page.tsx`, `app/layout.tsx`, `app/globals.css` |
| Core Components | `components/MarketplaceApp.tsx`, `components/ErrorDisplay.tsx` |
| UI Components | `components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `skeleton.tsx` |
| Hooks | `hooks/useMarketplaceClient.ts`, `hooks/usePageContext.ts` |
| Utilities | `lib/utils.ts`, `lib/install-guide-profile.ts` |

**After generation:** Users have full dev freedom. In the review screen, you may edit any file—both AI-generated and template files. Deploy and download intentionally merge your working-copy over the template so your edits are included. Config files (`package.json`, `marketplace-manifest.json`, etc.) are provided by the template but can be overridden by your edits when you deploy or download.

### Generation Pipeline

```
1. Prompt Construction
   - System prompt with rules, patterns, and pre-installed file list
   - Feature-specific SDK patterns injected based on selections
   - Extension-point-specific layout guidance
   - GraphQL safety rules + pre-validated mutation templates

2. AI Generation (Claude)
   - Generates AppFeature.tsx, types/index.ts, optional services/routes
   - Must use ```lang:path code block format for file extraction

3. Post-Processing
   - filterProtectedFiles() — strips locked template files from output
   - normalizeAppFeature() — ensures named + default exports
   - validateFiles() — checks AppFeature exists, all imports resolve,
     "use client" directives present

4. Auto-Repair (if validation fails)
   - Sends files + error list back to Claude
   - Claude outputs only corrected files
   - Re-applies filtering, normalization, validation

5. Debug Data Collection
   - Records validation errors/warnings, fixup attempts,
     normalization steps, request context
   - Stored with the generation result for inspection

6. Version Auto-Save
   - Result saved to localStorage version history
   - Up to 20 versions retained per app

7. Response
   - Returns generated files + status message + debug data
   - Warnings logged but non-blocking
```

### GraphQL Safety Rules Pipeline

When GraphQL features are selected:

```
1. Prompt Injection
   - GRAPHQL_SAFETY_RULES: 6 mandatory rules forbidding schema invention
   - Pre-validated mutation templates for common Authoring API operations
   - NO_SCHEMA_WARNING: limits AI to well-known Authoring API fields
   - Generates TODO comments for unverifiable Live API queries
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15+ (App Router) | Server + client rendering, API routes |
| Language | TypeScript (strict) | Type safety with path aliases |
| UI | Tailwind CSS + Sitecore Blok | Design system with CSS variable tokens |
| AI | Anthropic Claude API | Code generation and refinement |
| SDK | `@sitecore-marketplace-sdk/client` | Marketplace SDK communication |
| XMC | `@sitecore-marketplace-sdk/xmc` | SitecoreAI GraphQL integration |
| ZIP | JSZip | Server-side ZIP generation |
| Diff | diff | Version comparison and diff view |
| Markdown | react-markdown + remark-gfm | Chat response rendering |
| Syntax | react-syntax-highlighter | Code display with line numbers |
| Icons | lucide-react, @mdi/js | UI iconography |
| Deployment | Vercel Deployments API | One-click deployment |

## Project Structure

```
src/
+-  app/
|   +-- api/
|   |   +-- generate/route.ts           # AI generation pipeline
|   |   +-- deploy/route.ts             # Vercel deployment
|   |   +-- deployments/[id]/route.ts   # Deployment status polling
|   |   +-- download/route.ts           # Server-side ZIP preparation
|   |   +-- download/[id]/route.ts      # Cached ZIP download
|   |   +-- enhance/route.ts            # AI description enhancement
|   |   +-- enhance-refinement/route.ts # AI chat prompt enhancement
|   |   +-- template/route.ts           # Template file manifest
|   +-- download/[id]/page.tsx          # Download bridge page
|   +-- layout.tsx                      # Root layout
|   +-- page.tsx                        # Entry point
|   +-- globals.css                     # Tailwind + Blok CSS variables
+-- components/
|   +-- ui/                             # Blok/shadcn UI components
|   |   +-- badge.tsx, button.tsx, card.tsx, input.tsx, skeleton.tsx
|   +-- MarketplaceApp.tsx              # SDK init + demo mode detection
|   +-- Vibecore.tsx                    # Main app (wizard -> generate -> review)
|   +-- WizardStepType.tsx              # Step 1: Extension point selection
|   +-- WizardStepDetails.tsx           # Step 2: Name + description
|   +-- WizardStepFeatures.tsx          # Step 3: Feature checkboxes
|   +-- GenerationView.tsx              # Code review + deploy + download + debug
|   +-- GeneratingLoadingContent.tsx    # Animated loading screen
|   +-- CodeFileViewer.tsx              # Syntax display + inline editing
|   +-- ChatRefinement.tsx              # Iterative refinement chat
|   +-- VersionDiffView.tsx             # Side-by-side version comparison
|   +-- PreviousAppsList.tsx            # Saved app history sidebar
|   +-- SettingsPanel.tsx               # API key/token configuration
|   +-- InstallGuide.tsx                # Post-generation install steps
|   +-- MarkdownContent.tsx             # Markdown renderer for chat
|   +-- ErrorDisplay.tsx                # Error boundary component
+-- hooks/
|   +-- useMarketplaceClient.ts         # Singleton SDK initialization
+-- lib/
|   +-- prompts.ts                      # AI prompt engineering
|   +-- templates.ts                    # Template file content generation
|   +-- template-paths.ts              # Protected template path definitions
|   +-- graphql-safety-rules.ts         # GraphQL safety rules + verified mutation templates
|   +-- generation-history.ts          # localStorage version history system
|   +-- app-settings.ts               # Settings definitions + defaults
|   +-- app-settings-storage.ts        # Obfuscated localStorage persistence
|   +-- app-settings-server.ts         # Server-side env var + override resolution
|   +-- install-guide-profile.ts       # Install guide step builder
|   +-- zip-builder.ts                 # ZIP assembly + download bridge
|   +-- download-cache.ts             # Server-side download cache
|   +-- deploy/vercel.ts              # Vercel API integration
|   +-- icon.tsx                       # App icon component
|   +-- utils.ts                       # cn() utility
+-- types/
|   +-- index.ts                       # TypeScript interfaces
+-- marketplace-manifest.json          # Sitecore Marketplace manifest
+-- next.config.js                     # Next.js configuration
+-- tailwind.config.ts                 # Tailwind + Blok token config
```

## What Gets Generated

Every generated app is a complete, runnable Next.js project:

### Infrastructure (always included)
- `package.json` with correct SDK versions (`client ^0.3.2`, `xmc ^0.4.1`)
- `marketplace-manifest.json` auto-configured for the chosen extension point and permissions
- `hooks/useMarketplaceClient.ts` with singleton SDK initialization, retry logic, and SSR guards
- `hooks/usePageContext.ts` with live page context subscription
- `components/MarketplaceApp.tsx` with SDK init, loading skeleton, and error boundary
- `components/ErrorDisplay.tsx` for reusable error display
- `components/ui/*` with Blok UI components (Button, Card, Badge, Input, Skeleton)
- `tailwind.config.ts`, `tsconfig.json`, `next.config.js` with proper Sitecore configuration
- `README.md` with setup instructions tailored to the app's features

### Feature Code (AI-generated)
- `components/AppFeature.tsx` - Main UI and logic (required)
- `types/index.ts` - Domain type definitions (required)
- `services/[Feature]Service.ts` - Business logic layer (when using GraphQL)
- `app/api/[feature]/route.ts` - Server-side routes (when using external APIs)
- `.env.example` - Environment variable template (when using external APIs)

### Permission Mapping

| Feature | Permissions Granted |
|---------|-------------------|
| Page Context | `xmc:authoring:read` |
| GraphQL Read | `xmc:authoring:read` |
| GraphQL Write | `xmc:authoring:read`, `xmc:authoring:write` |
| Live Content | `xmc:live:read` |
| External API | None (server-side only) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `ANTHROPIC_MODEL` | No | Override default model (default: `claude-opus-6-4`) |
| `VERCEL_TOKEN` | No | Vercel API token for one-click deployment |
| `VERCEL_PROJECT_NAME` | No | Custom Vercel project name prefix |
| `VERCEL_TEAM_ID` | No | Vercel team ID used when disabling deployment protection under a team scope |
| `VIBECORE_AUTO_REDEPLOY` | No | When `true`, auto-redeploy after chat refinement when a previous deploy exists (default: `true`) |
| `VIBECORE_DISABLE_VERCEL_PROTECTION` | No | When `true`, disable Vercel project protection after deploy so preview URLs are public (default: `true`) |

The in-app `Settings` panel can store browser-local fallback values for the same fields above. Those overrides are only used when the matching server env var is missing, and sensitive values are only obfuscated in `localStorage`, not fully encrypted.

## Security

- **Settings storage**: Values saved in the Settings panel are obfuscated (base64 + reverse) in `localStorage`, not encrypted. Anyone with access to the browser can recover them. Prefer `.env.local` for sensitive keys when possible.
- **Vercel deployment protection**: When `VIBECORE_DISABLE_VERCEL_PROTECTION` is `true` (default), the app disables SSO and password protection on deployed projects so preview URLs are publicly accessible. If you deploy sensitive apps, set this to `false` to keep protection enabled.

## How It Works

1. **Describe** - Walk through the 3-step wizard to define your app's extension point, describe what it should do, and select the SDK capabilities it needs.

2. **Generate** - **Vibecore Studio** sends a carefully engineered prompt to Claude with Sitecore-specific patterns, SDK examples, GraphQL safety rules and mutation templates, and strict structural rules. The AI generates your feature code while the template provides the stable scaffolding.

3. **Validate** - A multi-pass pipeline checks that all imports resolve, required files exist, exports are compatible, and "use client" directives are present. If issues are found, an automatic repair pass fixes them. Full debug data is captured for every generation.

4. **Review** - Browse all generated files with syntax highlighting, edit files inline, inspect debug data via the bug icon, compare versions with the diff viewer, and use the built-in chat to request changes. Files update in place with each refinement and every change is auto-saved to version history.

5. **Deploy** - Hit "Deploy to Vercel" for instant cloud deployment with real-time build status, or download the complete source as a ZIP. Either way, you get a production-ready Next.js project.

6. **Install** - Follow the built-in install guide to register your app in the Sitecore Cloud Portal, set the deployment URL, and open it in SitecoreAI.

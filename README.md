# Hackathon Submission Entry form

- [Hackathon Submission Entry form](#hackathon-submission-entry-form)
  - [Team name](#team-name)
  - [Category](#category)
  - [Description](#description)
    - [Problem Statement](#problem-statement)
    - [How Vibecore Studio Solves It](#how-vibecore-studio-solves-it)
    - [Key Features](#key-features)
  - [Video link](#video-link)
  - [Pre-requisites and Dependencies](#pre-requisites-and-dependencies)
    - [System Requirements](#system-requirements)
    - [API \& Service Dependencies](#api--service-dependencies)
  - [Installation instructions](#installation-instructions)
    - [Configuration](#configuration)
    - [Running Inside SitecoreAI](#running-inside-sitecore-xm-cloud)
  - [Usage instructions](#usage-instructions)
  - [Comments](#comments)
    - [Architecture Overview](#architecture-overview)
    - [Source Code Highlights](#source-code-highlights)
    - [Future Iterations](#future-iterations)


## Team name

- Sitecorepunk 2077
  - [@GabeStreza](https://www.x.com/GabeStreza)

  ![](/docs/images/sitecore-punk-sitecore-hackathon-2026-logo.png)

## Category

> **Best Marketplace App**
> [ Next.js 15 + Anthropic Claude + Sitecore Marketplace SDK + Vercel Deployments API ]

## Description

**✨ Vibecore Studio** is an AI-powered Sitecore Marketplace app builder that runs as a standalone extension inside Sitecore Cloud Portal. 

![](/src/public/vibecorestudio-icon.png)

Users describe what they want in natural language via a guided 3-step wizard, and **✨ Vibecore Studio** generates a complete, production-ready Next.js project with the Sitecore Marketplace SDK, Blok design system, and best-practice patterns already wired in. 

One-click deployment to Vercel, iterative chat refinement, and full version history make the entire build-deploy-iterate cycle seamless.

No boilerplate. No guesswork. Just describe what you want, deploy, and install it in Sitecore.

### Problem Statement

Building **Sitecore Marketplace** apps today requires deep knowledge of the Marketplace SDK, PostMessage protocol, GraphQL APIs (Authoring, Preview, Experience Edge), the Blok design system, and Next.js app structure. 

The SDK documentation is spread across multiple sources, and developers must manually wire up singleton SDK initialization, error boundaries, subscription patterns, and GraphQL queries for every new app.

Scaffolding a new Marketplace app from scratch takes hours of boilerplate setup before any feature code is written. Getting the correct `marketplace-manifest.json`, permission scopes, extension point configuration, and deployment setup right involves significant trial and error.

This complexity means that non-expert Sitecore developers, content authors, and citizen developers are effectively locked out of the Marketplace entirely - they simply cannot build apps without investing significant time learning the SDK and infrastructure patterns.

**NOT ANYMORE!**

### How Vibecore Studio Solves It

**✨ Vibecore Studio** encodes all Sitecore Marketplace best practices into an AI-powered generation pipeline so that every generated app follows the same patterns used by Sitecore's own reference implementations.

The app uses a **"solidified scaffolding"** architecture: the template owns all structural files (SDK initialization, error handling, routing, UI components), while the AI generates only feature code at a single entry point (`AppFeature.tsx`). This separation ensures that generated apps always build and run correctly — the AI cannot break the infrastructure.

GraphQL safety rules and pre-validated mutation templates are injected into the prompt so the AI follows correct Sitecore GraphQL patterns. Six mandatory safety rules prevent the AI from inventing fields, types, or arguments that don't exist in the Sitecore schema.

A **multi-pass validation pipeline** catches errors after generation, attempts automatic repairs, and records full debug data for transparency. If validation fails, **✨ Vibecore Studio** sends the files and errors back to Claude for a fix-up pass — all without user intervention.

**One-click Vercel deployment** removes all DevOps friction. Hit deploy, watch the real-time build status, and get a preview URL the moment it's ready. Then follow the built-in install guide to register the app in Sitecore Cloud Portal.

**Iterative chat refinement** lets users evolve their app without starting over — "add a search bar", "switch to a table layout", "show page counts per site" — and the app regenerates with changes applied.

### Key Features

- ✨ **Guided 3-Step Wizard**
  - Walk through a streamlined builder experience: pick your extension point, describe your app, and choose the capabilities you need. An optional AI enhancement step refines your name and description before generation begins.
    > ![Step 1: Extension Point Selection](/docs/images/screenshots/01.png)
    
    <br/>

    > ![Step 2: App Details](/docs/images/screenshots/02.png)

    <br/>

    > ![Step 3: Feature Selection](/docs/images/screenshots/03.png)

<br/>

- 🔌 **All 5 Extension Points Supported**
  - Generate apps for every Sitecore surface: 
    - **Standalone** (full apps in Cloud Portal)
    - **Context Panel** (side panels in SitecoreAI Pages editor)
    - **Custom Field** (custom field types)
    - **Dashboard Widget** (compact widgets)
    - **Full Screen** (overlays inside SitecoreAI)

<br/>

- 🧠 **Feature-Aware Code Generation**
  - Select the capabilities your app needs and **✨ Vibecore Studio** injects the right SDK patterns: page context subscriptions, authoring GraphQL queries/mutations, Experience Edge queries, and server-side API routes with proper secret management.
    > ![Generation Loading Screen](/docs/images/screenshots/04.png)

<br/>

- 🔍 **GraphQL Safety Rules**
  - GraphQL safety rules and pre-validated mutation templates are injected into the prompt so generated apps follow correct Sitecore GraphQL patterns. Six mandatory safety rules forbid the AI from inventing fields, types, or arguments that don't exist in the Sitecore schema.
    > ![Debug Panel](/docs/images/screenshots/05.png)

<br/>

- 💻 **Instant Project Download**
  - Download the generated solution instantly with a single click. No waiting, no additional steps required.  Unzip, run it locally, and install to your SitecoreAI instance.
    > ![Instant Project Download](/docs/images/screenshots/06.png)

    > ![Instant Project Download](/docs/images/screenshots/06-01.png)

    > ![Instant Project Download](/docs/images/screenshots/06-02.png)

<br/>

- 🚀 **One-Click Vercel Deployment**
  - Deploy generated apps directly to Vercel from the review screen. ✨ **Vibecore Studio** uses the **Vercel Deployments API** to push your app live, polls for build status in real-time, and gives you a preview URL the moment it's ready. No CLI, no git push needed.  
    > ![Deploy to Vercel](/docs/images/screenshots/07.png)

    > ![Vercel Deployment](/docs/images/screenshots/07-01.png)


<br/>

- 📋 **Built-in Install Guide**
  - After generation, a tailored install guide walks users through registering the app in Sitecore Cloud Portal, selecting the correct extension point, configuring API access, and activating the app.  Opening the app outside of the context of Sitecore Cloud Portal also surfaces the customized guide to help users understand how to get their generated app installed and running.
    > ![Install Guide](/docs/images/screenshots/10.png)


- 💬 **Iterative Refinement via Chat**
  - Not quite right? Use the built-in chat to ask for changes. An optional AI enhance step can refine your chat prompt before sending. **✨ Vibecore Studio** updates the generated files in place and you can re-deploy immediately.
    > ![Chat Refinement](/docs/images/screenshots/11-00.png)

    > ![Chat Refinement](/docs/images/screenshots/11-01.png)

    > ![Chat Refinement](/docs/images/screenshots/11-02.png)

<br/>

- ✏️ **Inline File Editing**
  - Edit any generated file directly in the review screen with syntax highlighting. Changes are tracked and can be saved as new versions.
    > ![Code Editor](/docs/images/screenshots/12-00.png)

    > ![Code Editor](/docs/images/screenshots/12-01.png)

<br/>

- 📜 **Version History & Diff View**
  - Every generation and refinement is automatically saved as a version in localStorage (up to 20 versions per app). Browse your version history, compare changes between versions with a side-by-side diff view, and restore any previous state.
    > ![Version History & Diff](/docs/images/screenshots/13-00.png)

    > ![Version History & Diff](/docs/images/screenshots/13-01.png)

    > ![Version History & Diff](/docs/images/screenshots/13-02.png)

    > ![Version History & Diff](/docs/images/screenshots/13-03.png)

<br/>



<br/>

- 📂 **Previous Apps Sidebar**
  - Reopen any previously generated app from the sidebar. Apps are stored by name in localStorage and persist across sessions. Deleting an app from the sidebar removes it from localStorage. This allows users to manage multiple generated apps in one place and easily switch between them.
    > ![Previous Apps](/docs/images/screenshots/14-00.png)

    > ![Previous Apps](/docs/images/screenshots/14-01.png)

<br/>

- ⚙️ **Settings Panel**
  - Configure API keys and tokens directly in the browser without `.env.local` files. Settings are obfuscated in localStorage and are only used when the corresponding server environment variable is missing. 
    - > This allows users to test the app without creating a `.env.local` file, but also keeps sensitive keys out of localStorage when server environment variables are set. 
    - > In a production environment, you would typically set environment variables in your hosting platform and not use the in-app settings at all. The settings panel is primarily for ease of testing and demo purposes as we don't want to require judges to create an Anthropic account and generate an API key just to see the app in action.)
    > ![Settings Panel](/docs/images/screenshots/15-00.png)

    > ![Settings Panel](/docs/images/screenshots/15-01.png)

<br/>

- 👍 **Production-Ready Output**
  - Every generated app follows the same patterns used by Sitecore's own reference implementations: singleton SDK initialization with retry logic and race condition protection, three-tier error handling (SDK, API, UI) with error boundaries, proper GraphQL query/mutation patterns, service layer architecture, TypeScript strict mode, and Sitecore Blok design system components.
  - > While the AI generates the feature code, the underlying template ensures that all structural and architectural best practices are followed, so every generated app is production-ready and maintainable.
  - > Even with these gaurdrails in place, the AI still has a lot of freedom to generate unique and creative apps that can do anything within the bounds of the selected features and extension point. The template provides the structure and patterns, but the AI fills in all the actual code and logic for the app's functionality. 
  - > This gives developers a huge head start on building Marketplace apps, while still allowing for infinite variety and creativity in the types of apps that can be generated.

<br/>

- 🌐 **Works Anywhere**
  - Run **✨ Vibecore Studio** as a Sitecore Marketplace standalone extension inside Cloud Portal, or use it in standalone demo mode at `localhost:3000`. A "Demo Mode" badge appears when running outside Sitecore. No Sitecore connection is required for generation.
    > ![Demo Mode](/docs/images/screenshots/16.png)

<br/>


## Video link
> 🎥 [https://youtu.be/-TbKYo-N_-4](https://youtu.be/-TbKYo-N_-4)



<br/>

## Pre-requisites and Dependencies

### System Requirements

- Node.js **18+** (LTS recommended)
- npm (comes with Node.js)
- A modern browser (Chrome, Edge, Firefox)
- Git (to clone the repository)

### API & Service Dependencies

1. 🔑 **Anthropic API Key** (required)
   - Required for AI-powered code generation via **Claude**.
   - Sign up at [Anthropic Console](https://console.anthropic.com/) and navigate to `API Keys` to generate a new key.
   - The app uses `claude-opus-4-6` by default (configurable via the `ANTHROPIC_MODEL` environment variable).
   - > **Opus 4.6** has provided the most consistent and high-quality code generation results in testing.  I do not recommend using other models for this use case, but users with access to multiple models can experiment by setting the `ANTHROPIC_MODEL` environment variable to see how it impacts generation quality.

<br/>

2. 🚀 **Vercel Token** (technically optional, but one of the best parts!)
   - Required only for one-click Vercel deployment from the review screen.
   - Generate a token at [Vercel Account Tokens](https://vercel.com/account/tokens).
      > ![Vercel Token](/docs/images/screenshots/17.png)
    
      >  Without a connection to Vercel, users can still download the generated app as a ZIP and deploy manually, although the full-experience of deploying to Vercel, installing to Sitecore, and iterating with chat refinement is only available when the token is provided. 

<br/>

1. ⭕ **SitecoreAI Instance** (optional)
   - Required only for running as an installed Marketplace app inside Cloud Portal.
   - The app works fully in **demo mode** (localhost:3000) without any Sitecore connection. Generation, refinement, deployment, and download all work in demo mode.

<br/>

4. 🌎 **Internet Access**
   - Required for Anthropic API calls and Vercel deployment.

<br/>

> 👨‍⚖️ **Judges:** I can provide both an Anthropic Key and a Vercel Token for testing the app remotely where you can experience the app without exposing my API keys from the repository. Please reach out `@GabeStreza` on Slack and I can provide a keys/tokens!


## Installation instructions

1. Clone the repository:

```bash
git clone https://github.com/Sitecore-Hackathon/2026-Sitecorepunk-2077.git
cd 2026-Sitecorepunk-2077
```

<br/>

2. Install dependencies:

```bash
npm install
```

<br/>

3. Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
VERCEL_TOKEN=your-vercel-token          # Optional: enables Deploy to Vercel
```

<br/>

4. Start the development server:

```bash
npm run dev
```

<br/>

5. Open [http://localhost:3000](http://localhost:3000) in your browser and start building.

<br/>

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude code generation |
| `ANTHROPIC_MODEL` | No | Override default model (default: `claude-opus-6-4`) |
| `VERCEL_TOKEN` | No | Vercel API token for one-click deployment |
| `VERCEL_PROJECT_NAME` | No | Custom Vercel project name prefix |
| `VERCEL_TEAM_ID` | No | Vercel team ID for deployments under a team scope |
| `VIBECORE_AUTO_REDEPLOY` | No | Auto-redeploy after chat refinement when a previous deploy exists (default: `true`) |
| `VIBECORE_DISABLE_VERCEL_PROTECTION` | No | Disable Vercel project protection after deploy so preview URLs are public (default: `true`) |

**Alternative: In-App Settings Panel** — If you prefer not to create a `.env.local` file, use the in-app **Settings** panel (gear icon) to save API keys and tokens directly in the browser. Browser-stored values are only used when the corresponding server environment variable is missing.

### Running Inside SitecoreAI

1. Go to [Sitecore Cloud Portal](https://portal.sitecorecloud.io) > App Studio
2. Create a custom app with extension point: **Standalone**
3. Set deployment URL to `http://localhost:3000` (or your Vercel URL)
4. Install in your SitecoreAI environment 
5. Open **✨ Vibecore Studio** from Cloud Portal and start generating apps

<br/>


## Usage instructions

1. **Launch Vibecore Studio** — Open [http://localhost:3000](http://localhost:3000) or open the app from Sitecore Cloud Portal. A welcome screen introduces the three-step flow.
   > ![Welcome](/docs/images/screenshots/18-00.png)
   > ![Welcome](/docs/images/screenshots/18-01.png)
   > ![Welcome](/docs/images/screenshots/18-02.png)

<br/>

1. **Step 1: Choose Extension Point** — Select one of the 5 Sitecore extension points for your app (Standalone, Context Panel, Custom Field, Dashboard Widget, Full Screen).
   > ![Step 1](/docs/images/screenshots/01.png)

<br/>

3. **Step 2: Describe Your App** — Enter an app name and description. Optionally click **"Enhance"** to refine your description with AI. Sample ideas are provided based on your extension point selection.
   > ![Step 2](/docs/images/screenshots/02.png)

<br/>

4. **Step 3: Select Features** — Check the SDK capabilities your app needs: Page Context Subscription, Authoring GraphQL (Read/Write), Experience Edge, External API Integration.
   > ![Step 3](/docs/images/screenshots/03.png)

<br/>

5. **Generate** — Click **"Generate"** and watch the animated loading screen. The AI generates your app with a multi-pass validation pipeline that auto-repairs errors.
   > ![Generating](/docs/images/screenshots/04.png)

<br/>

6. **Review Generated Code** — Browse the full file tree (template + generated files) and view any file with syntax highlighting and line numbers.
   > ![Review Screen](/docs/images/screenshots/19.png)

<br/>

7. **Edit Files Inline** — Click any file to view it. Toggle edit mode, make changes directly in the browser, and save as a new version.
   > ![Editing](/docs/images/screenshots/20.png)

<br/>

8. **Refine with Chat** — Open the chat panel and type a change request (e.g., "add a search bar", "switch to a table layout"). Optionally enhance the prompt with AI before sending. The app regenerates with your changes applied.
   > ![Chat Refinement](/docs/images/screenshots/07.png)

<br/>

9. **Deploy to Vercel** — Click **"Deploy to Vercel"** in the toolbar. Watch the real-time build status. Get your preview URL when the build completes.
   > ![Deploy](/docs/images/screenshots/06.png)

<br/>

10. **Follow the Install Guide** — Use the built-in install guide to register your generated app in Sitecore Cloud Portal, set the deployment URL, and install it in your environment.
    > ![Install Guide](/docs/images/screenshots/10.png)

<br/>

11. **Download as ZIP** — Alternatively, click **"Download ZIP"** to export the complete project source for manual deployment.

<br/>

12. **Browse Version History** — View all versions in the history panel. Compare any two versions with the side-by-side diff viewer. Restore a previous version at any time.
    > ![Version History](/docs/images/screenshots/13-01.png)

<br/>

13. **Inspect with Debug Panel** — Click the bug icon to inspect the full generation pipeline: validation errors and warnings, auto-repair attempts, normalization steps, and the raw AI response.
    > ![Debug Panel](/docs/images/screenshots/05.png)

<br/>


## Comments

### Architecture Overview

**✨ Vibecore Studio** uses a **"solidified scaffolding"** architecture to ensure generated apps always build successfully:

```
Template (locked, never AI-generated):
  app/page.tsx --> MarketplaceApp.tsx --> imports { AppFeature }

AI-Generated (single entry point):
  components/AppFeature.tsx  <-- ALL feature code lives here
  types/index.ts             <-- Domain type definitions
  services/[Feature]Service  <-- Business logic (optional)
  app/api/[feature]/route    <-- Server routes (optional)
```

The generation pipeline follows this flow:

```
Wizard (3 steps) --> Generation --> Validation --> Review & Chat --> Deploy / Download
                         |                            |
                    Claude API              Iterative refinement
                   (multi-pass)            (chat-driven updates)
                         |                            |
                  Safety rules &               Version history
                  mutation templates            (auto-saved)
```

**Key architectural decisions:**
- `MarketplaceApp.tsx` handles all SDK initialization, loading, and error states, then renders `<AppFeature client={client} />`
- The AI generates `AppFeature.tsx` with a strict contract: `export function AppFeature({ client }: { client: ClientSDK })`
- A protected file list prevents the AI from ever overriding structural files (SDK init, error handling, UI components, hooks)
- Post-processing normalizes exports automatically and validates all imports resolve
- GraphQL safety rules and pre-validated mutation templates are injected into the prompt so generated apps follow correct Sitecore GraphQL patterns

### Source Code Highlights

| File | Purpose |
|------|---------|
| [`lib/prompts.ts`](/lib/prompts.ts) | AI prompt engineering — system prompt construction, SDK patterns, extension-point guidance |
| [`lib/templates.ts`](/lib/templates.ts) | Template content — package.json, manifest, config files, scaffold components |
| [`app/api/generate/route.ts`](/app/api/generate/route.ts) | Main generation pipeline — extraction, filtering, validation, auto-repair, debug data |
| [`lib/graphql-safety-rules.ts`](/lib/graphql-safety-rules.ts) | GraphQL safety rules and verified mutation templates |
| [`lib/generation-history.ts`](/lib/generation-history.ts) | localStorage version history system (up to 20 versions per app) |
| [`lib/deploy/vercel.ts`](/lib/deploy/vercel.ts) | Vercel Deployments API integration |
| [`lib/zip-builder.ts`](/lib/zip-builder.ts) | ZIP assembly for download with template + working copy merge |
| [`components/Vibecore.tsx`](/components/Vibecore.tsx) | Main app orchestrator - wizard state, generation, review, previous apps |

### Future Iterations

- AI-generated app icon images for each generated project
- Multi-model support (OpenAI, Gemini) alongside Claude
- Import/export of app configurations for sharing and backup
- Collaborative generation with multiple team members
- Community template marketplace for shared starting points
- Component-level generation (generate individual components, not just full apps)

# Noteworthy Agg Generations During Development

Apps I built during development to test specific features, patterns, and edge cases. These are not meant to be polished or fully functional apps, but they demonstrate the variety of outputs that **✨ Vibecore Studio** can generate based on different inputs and feature selections.

![alt text](image.png)

---
## SEO Governance Assistant
![alt text](/docs/images/screenshots/seo-goc-assist-demo.png)

## MarketPlace SDK Explorer
![alt text](/docs/images/screenshots/marketplacesdkexpl.png)

## AI Content Briefs 
![alt text](/docs/images/screenshots/aicontentbriefs.png)

## Marketplace SDK Capabilities
![alt text](/docs/images/screenshots/sdk-capabilities.jpeg)

## Sitecore Content Operations
![alt text](/docs/images/screenshots/scops.png)

## Site Structure Explorer
![alt text](/docs/images/screenshots/sitestructureexplorer.png)

## Icon Picker Custom Field
![alt text](/docs/images/screenshots/iconpicker.png)

## Topic Taxonomy Picker Custom Field
![alt text](/docs/images/screenshots/taxonmom.png)

## Snake 🐍
![alt text](/docs/images/screenshots/snake.png)

import type { AppConfig, ExtensionPointType } from "@/types";

const PERMISSION_MAP: Record<string, string[]> = {
  "graphql-read": ["xmc:authoring:read"],
  "graphql-write": ["xmc:authoring:read", "xmc:authoring:write"],
  "live-content": ["xmc:live:read"],
  "page-context": ["xmc:authoring:read"],
  "external-api": [],
};

function getPermissions(features: string[]): string[] {
  const perms = new Set<string>();
  for (const f of features) {
    const p = PERMISSION_MAP[f];
    if (p) p.forEach((x) => perms.add(x));
  }
  if (perms.size === 0) perms.add("xmc:authoring:read");
  return Array.from(perms);
}

function buildManifest(config: AppConfig): string {
  return JSON.stringify(
    {
      name: config.appName,
      id: config.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      version: "1.0.0",
      description: config.description.slice(0, 200),
      author: "Vibecore",
      extensionPoints: [config.extensionPoint],
      permissions: getPermissions(config.features),
      configuration: {
        entryPoint: "/",
        width: config.extensionPoint === "xmc:pages:contextpanel" ? 400 : 1000,
        height: 700,
        resizable: true,
      },
      dependencies: {
        "@sitecore-marketplace-sdk/client": "^0.3.2",
        "@sitecore-marketplace-sdk/xmc": "^0.4.1",
      },
    },
    null,
    2
  );
}

function buildPackageJson(config: AppConfig): string {
  const deps: Record<string, string> = {
    next: "^15.0.0",
    react: "^19.0.0",
    "react-dom": "^19.0.0",
    "@sitecore-marketplace-sdk/client": "^0.3.2",
    "@sitecore-marketplace-sdk/xmc": "^0.4.1",
    "class-variance-authority": "^0.7.1",
    clsx: "^2.1.1",
    "lucide-react": "^0.460.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "@radix-ui/react-slot": "^1.2.4",
  };

  return JSON.stringify(
    {
      name: config.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: deps,
      devDependencies: {
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        autoprefixer: "^10.0.0",
        postcss: "^8.0.0",
        tailwindcss: "^3.4.0",
        typescript: "^5.0.0",
      },
    },
    null,
    2
  );
}

const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.sitecorecloud.io https://sitecorecloud.io https://*.vercel.app",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;

const VERCEL_JSON = JSON.stringify(
  {
    framework: "nextjs",
    buildCommand: "npm run build",
    outputDirectory: ".next",
    installCommand: "npm install",
  },
  null,
  2
);

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "es2020",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      baseUrl: ".",
      paths: { "@/*": ["./*"] },
      plugins: [{ name: "next" }],
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  },
  null,
  2
);

const TAILWIND_CONFIG = `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          bg: "var(--primary-background)",
          "bg-active": "var(--primary-background-active)",
        },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
          600: "var(--color-danger-600)",
          700: "var(--color-danger-700)",
          hover: "var(--destructive-hover)",
          active: "var(--destructive-active)",
          bg: "var(--destructive-background)",
          "bg-active": "var(--destructive-background-active)",
        },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        "neutral-bg": "var(--neutral-background)",
        "neutral-bg-active": "var(--neutral-background-active)",
        "inverse-text": "var(--inverse)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
          hover: "var(--success-hover)",
          active: "var(--success-active)",
          bg: "var(--success-background)",
          "bg-active": "var(--success-background-active)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
          hover: "var(--warning-hover)",
          active: "var(--warning-active)",
          bg: "var(--warning-background)",
          "bg-active": "var(--warning-background-active)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
          hover: "var(--info-hover)",
          active: "var(--info-active)",
          bg: "var(--info-background)",
          "bg-active": "var(--info-background-active)",
        },
        neutral: {
          DEFAULT: "var(--neutral)",
          foreground: "var(--neutral-foreground)",
          hover: "var(--neutral-hover)",
          active: "var(--neutral-active)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "4xl": "2rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
`;

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

const GLOBALS_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Sitecore Blok theme - color tokens and semantic mappings */
:root {
  --color-transparent: transparent;
  --color-current: currentColor;
  --color-black: #000000;
  --color-white: #ffffff;
  --color-whiteAlpha-50: rgba(255, 255, 255, 0.04);
  --color-whiteAlpha-100: rgba(255, 255, 255, 0.06);
  --color-whiteAlpha-200: rgba(255, 255, 255, 0.11);
  --color-whiteAlpha-300: rgba(255, 255, 255, 0.29);
  --color-whiteAlpha-400: rgba(255, 255, 255, 0.42);
  --color-whiteAlpha-500: rgba(255, 255, 255, 0.55);
  --color-whiteAlpha-600: rgba(255, 255, 255, 0.68);
  --color-whiteAlpha-700: rgba(255, 255, 255, 0.76);
  --color-whiteAlpha-800: rgba(255, 255, 255, 0.78);
  --color-whiteAlpha-900: rgba(255, 255, 255, 0.94);
  --color-blackAlpha-50: rgba(0, 0, 0, 0.04);
  --color-blackAlpha-100: rgba(0, 0, 0, 0.06);
  --color-blackAlpha-200: rgba(0, 0, 0, 0.11);
  --color-blackAlpha-300: rgba(0, 0, 0, 0.29);
  --color-blackAlpha-400: rgba(0, 0, 0, 0.42);
  --color-blackAlpha-500: rgba(0, 0, 0, 0.55);
  --color-blackAlpha-600: rgba(0, 0, 0, 0.68);
  --color-blackAlpha-700: rgba(0, 0, 0, 0.76);
  --color-blackAlpha-800: rgba(0, 0, 0, 0.78);
  --color-blackAlpha-900: rgba(0, 0, 0, 0.94);
  --color-blue-50: #f4f7ff;
  --color-blue-100: #e1eaff;
  --color-blue-200: #c9d8ff;
  --color-blue-300: #9cb3fd;
  --color-blue-400: #6987f9;
  --color-blue-500: #4a65e8;
  --color-blue-600: #344bc3;
  --color-blue-700: #293ba1;
  --color-blue-800: #1f2d7f;
  --color-blue-900: #16215f;
  --color-cyan-50: #eafaff;
  --color-cyan-100: #c6f1ff;
  --color-cyan-200: #a0e3fd;
  --color-cyan-300: #5cc0f1;
  --color-cyan-400: #2695de;
  --color-cyan-500: #0873c8;
  --color-cyan-600: #0059a1;
  --color-cyan-700: #004783;
  --color-cyan-800: #003767;
  --color-cyan-900: #00294d;
  --color-danger-50: #fff5f4;
  --color-danger-100: #ffe4e2;
  --color-danger-200: #ffccc8;
  --color-danger-300: #ff9a94;
  --color-danger-400: #f4595a;
  --color-danger-500: #d92739;
  --color-danger-600: #b30426;
  --color-danger-700: #92001f;
  --color-danger-800: #730019;
  --color-danger-900: #580113;
  --color-gray-50: #f7f7f7;
  --color-gray-100: #e9e9e9;
  --color-gray-200: #d8d8d8;
  --color-gray-300: #b5b5b5;
  --color-gray-400: #8e8e8e;
  --color-gray-500: #717171;
  --color-gray-600: #535353;
  --color-gray-700: #3b3b3b;
  --color-gray-800: #282828;
  --color-gray-900: #212121;
  --color-green-50: #e8fcf5;
  --color-green-100: #bef6e3;
  --color-green-200: #8bebd0;
  --color-green-300: #44cbac;
  --color-green-400: #0ea184;
  --color-green-500: #007f66;
  --color-green-600: #006450;
  --color-green-700: #085040;
  --color-green-800: #0d3e31;
  --color-green-900: #0f2d25;
  --color-info-50: #f7f6ff;
  --color-info-100: #eae7ff;
  --color-info-200: #d9d4ff;
  --color-info-300: #b8a9ff;
  --color-info-400: #9373ff;
  --color-info-500: #6e3fff;
  --color-info-600: #5319e0;
  --color-info-700: #4715af;
  --color-info-800: #401791;
  --color-info-900: #2f1469;
  --color-orange-50: #fff6e7;
  --color-orange-100: #ffe6bd;
  --color-orange-200: #fdd291;
  --color-orange-300: #ffa037;
  --color-orange-400: #e26e00;
  --color-orange-500: #ba5200;
  --color-orange-600: #953d00;
  --color-orange-700: #7a2f00;
  --color-orange-800: #612300;
  --color-orange-900: #491901;
  --color-pink-50: #fff4fe;
  --color-pink-100: #ffe2fb;
  --color-pink-200: #fec7f8;
  --color-pink-300: #f592f3;
  --color-pink-400: #de53e0;
  --color-pink-500: #bc29bd;
  --color-pink-600: #9d039e;
  --color-pink-700: #800081;
  --color-pink-800: #640664;
  --color-pink-900: #470e46;
  --color-primary-50: #f7f6ff;
  --color-primary-100: #eae7ff;
  --color-primary-200: #d9d4ff;
  --color-primary-300: #b8a9ff;
  --color-primary-400: #9373ff;
  --color-primary-500: #6e3fff;
  --color-primary-600: #5319e0;
  --color-primary-700: #4715af;
  --color-primary-800: #401791;
  --color-primary-900: #2f1469;
  --color-purple-50: #f7f6ff;
  --color-purple-100: #eae7ff;
  --color-purple-200: #d9d4ff;
  --color-purple-300: #b8a9ff;
  --color-purple-400: #9373ff;
  --color-purple-500: #6e3fff;
  --color-purple-600: #5319e0;
  --color-purple-700: #4715af;
  --color-purple-800: #401791;
  --color-purple-900: #2f1469;
  --color-red-50: #fff5f4;
  --color-red-100: #ffe4e2;
  --color-red-200: #ffccc8;
  --color-red-300: #ff9a94;
  --color-red-400: #f4595a;
  --color-red-500: #d92739;
  --color-red-600: #b30426;
  --color-red-700: #92001f;
  --color-red-800: #730019;
  --color-red-900: #580113;
  --color-success-50: #e8fcf5;
  --color-success-100: #bef6e3;
  --color-success-200: #8bebd0;
  --color-success-300: #44cbac;
  --color-success-400: #0ea184;
  --color-success-500: #007f66;
  --color-success-600: #006450;
  --color-success-700: #085040;
  --color-success-800: #0d3e31;
  --color-success-900: #0f2d25;
  --color-teal-50: #e7fbfb;
  --color-teal-100: #bbf4f3;
  --color-teal-200: #8be9e8;
  --color-teal-300: #3cc8cb;
  --color-teal-400: #019ea5;
  --color-teal-500: #007c85;
  --color-teal-600: #00626b;
  --color-teal-700: #0a4e57;
  --color-teal-800: #103b44;
  --color-teal-900: #102c33;
  --color-warning-50: #fff6e7;
  --color-warning-100: #ffe6bd;
  --color-warning-200: #fdd291;
  --color-warning-300: #ffa037;
  --color-warning-400: #e26e00;
  --color-warning-500: #ba5200;
  --color-warning-600: #953d00;
  --color-warning-700: #7a2f00;
  --color-warning-800: #612300;
  --color-warning-900: #491901;
  --color-yellow-50: #fdf8d2;
  --color-yellow-100: #faec79;
  --color-yellow-200: #f8d904;
  --color-yellow-300: #d7b300;
  --color-yellow-400: #ae8a00;
  --color-yellow-500: #8b6b00;
  --color-yellow-600: #705300;
  --color-yellow-700: #5b4300;
  --color-yellow-800: #483300;
  --color-yellow-900: #362500;
  --color-neutral-600: #4a4a4a;
  --radius: 0.625rem;
  --background: var(--color-white);
  --muted: var(--color-gray-50);
  --foreground: var(--color-blackAlpha-900);
  --muted-foreground: var(--color-blackAlpha-500);
  --placeholder: var(--color-blackAlpha-400);
  --inverse: var(--color-white);
  --border: var(--color-blackAlpha-200);
  --border-a11y: var(--color-blackAlpha-400);
  --input: var(--color-blackAlpha-400);
  --primary-foreground: var(--color-white);
  --destructive-foreground: var(--color-danger-600);
  --warning-foreground: var(--color-warning-600);
  --success-foreground: var(--color-success-600);
  --info-foreground: var(--color-info-600);
  --neutral-foreground: var(--color-blackAlpha-600);
  --primary-background: var(--color-primary-100);
  --destructive-background: var(--color-danger-100);
  --warning-background: var(--color-warning-100);
  --success-background: var(--color-success-100);
  --info-background: var(--color-info-100);
  --neutral-background: var(--color-blackAlpha-100);
  --primary-background-active: var(--color-primary-200);
  --destructive-background-active: var(--color-danger-200);
  --warning-background-active: var(--color-warning-200);
  --success-background-active: var(--color-success-200);
  --info-background-active: var(--color-info-200);
  --neutral-background-active: var(--color-blackAlpha-200);
  --primary: var(--color-primary-500);
  --destructive: var(--color-danger-500);
  --success: var(--color-success-500);
  --warning: var(--color-warning-500);
  --info: var(--color-info-500);
  --neutral: var(--color-blackAlpha-500);
  --primary-hover: var(--color-primary-600);
  --destructive-hover: var(--color-danger-600);
  --success-hover: var(--color-success-600);
  --warning-hover: var(--color-warning-600);
  --info-hover: var(--color-info-600);
  --neutral-hover: var(--color-neutral-600);
  --primary-active: var(--color-primary-700);
  --destructive-active: var(--color-danger-700);
  --success-active: var(--color-success-700);
  --warning-active: var(--color-warning-700);
  --info-active: var(--color-info-700);
  --neutral-active: var(--color-neutral-700);
  --card: var(--background);
  --card-foreground: var(--foreground);
  --popover: var(--background);
  --popover-foreground: var(--foreground);
  --secondary: var(--muted);
  --secondary-foreground: var(--foreground);
  --accent: var(--muted);
  --accent-foreground: var(--foreground);
  --ring: #6987f9;
  --chart-1: #4E41CC;
  --chart-2: #0FB5AE;
  --chart-3: #F08910;
  --chart-4: #33C5E8;
  --chart-5: #E055E2;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
  --shadow-extraSmall: 0 0 0 1px rgba(0, 0, 0, 0.05);
  --shadow-small: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-default: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-large: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-extraLarge: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2extraLarge: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-focus: 0 0 0 3px rgba(110, 63, 255, 0.6);
  --shadow-inset: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  --shadow-elevated: rgba(0, 0, 0, 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 5px 10px, rgba(0, 0, 0, 0.4) 0px 15px 40px;
}

.dark {
  --background: var(--color-gray-800);
  --muted: var(--color-gray-900);
  --foreground: var(--color-white);
  --muted-foreground: var(--color-whiteAlpha-600);
  --placeholder: var(--color-whiteAlpha-500);
  --inverse: var(--color-blackAlpha-900);
  --border: var(--color-whiteAlpha-200);
  --border-a11y: var(--color-whiteAlpha-400);
  --input: var(--color-whiteAlpha-500);
  --primary-foreground: var(--color-primary-900);
  --destructive-foreground: var(--color-danger-200);
  --warning-foreground: var(--color-warning-200);
  --success-foreground: var(--color-success-200);
  --info-foreground: var(--color-info-200);
  --neutral-foreground: var(--color-whiteAlpha-700);
  --primary-background: rgba(217, 212, 255, 0.12);
  --destructive-background: rgba(255, 204, 200, 0.12);
  --warning-background: rgba(253, 210, 145, 0.12);
  --success-background: rgba(139, 235, 208, 0.12);
  --info-background: rgba(217, 212, 255, 0.12);
  --neutral-background: var(--color-whiteAlpha-100);
  --primary-background-active: rgba(217, 212, 255, 0.24);
  --destructive-background-active: rgba(255, 204, 200, 0.24);
  --warning-background-active: rgba(253, 210, 145, 0.24);
  --success-background-active: rgba(139, 235, 208, 0.24);
  --info-background-active: rgba(217, 212, 255, 0.24);
  --neutral-background-active: var(--color-whiteAlpha-300);
  --primary: var(--color-primary-200);
  --destructive: var(--color-danger-200);
  --success: var(--color-success-200);
  --warning: var(--color-warning-200);
  --info: var(--color-info-200);
  --neutral: var(--color-whiteAlpha-600);
  --primary-hover: var(--color-primary-300);
  --destructive-hover: var(--color-danger-300);
  --success-hover: var(--color-success-300);
  --warning-hover: var(--color-warning-300);
  --info-hover: var(--color-info-300);
  --neutral-hover: var(--color-neutral-300);
  --primary-active: var(--color-primary-400);
  --destructive-active: var(--color-danger-400);
  --success-active: var(--color-success-400);
  --warning-active: var(--color-warning-400);
  --info-active: var(--color-info-400);
  --neutral-active: var(--color-neutral-400);
  --card: var(--background);
  --card-foreground: var(--foreground);
  --popover: var(--background);
  --popover-foreground: var(--foreground);
  --secondary: var(--muted);
  --secondary-foreground: var(--foreground);
  --accent: var(--muted);
  --accent-foreground: var(--foreground);
  --ring: #6987f9;
  --chart-1: var(--color-purple-500);
  --chart-2: var(--color-blue-500);
  --chart-3: var(--color-cyan-500);
  --chart-4: var(--color-teal-500);
  --chart-5: var(--color-green-500);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.439 0 0);
  --shadow-extraSmall: 0 0 0 1px rgba(255, 255, 255, 0.05);
  --shadow-small: 0 1px 2px 0 rgba(255, 255, 255, 0.05);
  --shadow-default: 0 1px 3px 0 rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(255, 255, 255, 0.06);
  --shadow-medium: 0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06);
  --shadow-large: 0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05);
  --shadow-extraLarge: 0 20px 25px -5px rgba(255, 255, 255, 0.1), 0 10px 10px -5px rgba(255, 255, 255, 0.04);
  --shadow-2extraLarge: 0 25px 50px -12px rgba(255, 255, 255, 0.25);
  --shadow-focus: 0 0 0 3px rgba(110, 63, 255, 0.6);
  --shadow-inset: inset 0 2px 4px 0 rgba(255, 255, 255, 0.06);
  --shadow-elevated: rgba(255, 255, 255, 0.1) 0px 0px 0px 1px, rgba(255, 255, 255, 0.2) 0px 5px 10px, rgba(255, 255, 255, 0.4) 0px 15px 40px;
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
`;

const LAYOUT_TSX = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sitecore Marketplace App",
  description: "Built with Vibecore Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

const PAGE_TSX = `"use client";

import { MarketplaceApp } from "@/components/MarketplaceApp";

export default function Page() {
  return <MarketplaceApp />;
}
`;

const MARKETPLACE_APP_TSX = `"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppFeature } from "@/components/AppFeature";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import {
  APP_STUDIO_URL,
  buildInstallGuideProfileFromManifest,
  buildSetupStepsFromManifest,
  type InstallGuideChoice,
  type InstallGuideProfile,
  type SetupStep,
} from "@/lib/install-guide-profile";

function isSetupRequiredError(error: Error): boolean {
  const errorWithCode = error as Error & { code?: string };
  const code = errorWithCode.code?.toUpperCase();
  const message = error.message.toLowerCase();

  return (
    code === "INVALID_ORIGIN" ||
    code === "TIMEOUT" ||
    code === "HANDSHAKE_FAILED" ||
    code === "CONNECTION_ERROR" ||
    message.includes("invalid message origin") ||
    message.includes("request timed out") ||
    message.includes("failed to establish connection")
  );
}

export function MarketplaceApp() {
  const deploymentUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-app-url.example";
  const profile = buildInstallGuideProfileFromManifest();
  const setupSteps = buildSetupStepsFromManifest(deploymentUrl);
  const { client, error, isLoading, isInitialized, initialize } =
    useMarketplaceClient();

  if (isLoading) return <LoadingScreen />;

  if (error) {
    if (isSetupRequiredError(error)) {
      return (
        <SetupRequiredScreen
          profile={profile}
          steps={setupSteps}
          title="App Setup Required"
          message="This app cannot be initialized outside Sitecore App Studio."
          details="Configure and install the app in Sitecore App Studio, then open it from Sitecore to use it."
        />
      );
    }

    return (
      <ConnectionErrorScreen
        title="Connection Error"
        message={error.message}
        onRetry={initialize}
      />
    );
  }

  if (!isInitialized || !client) return <LoadingScreen />;

  return <AppFeature client={client} />;
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
      // Ignore clipboard errors in the setup UI.
    }
  }, [value]);

  return (
    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
      {copied ? "Copied!" : label}
    </Button>
  );
}

function LoadingScreen() {
  return (
    <StatusScreen
      title="Initializing App"
      description="Checking the Sitecore App Studio connection and preparing the SDK."
      icon={
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      }
      iconTone="primary"
      widthClass="max-w-md"
    >
      <div className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          This should only take a moment.
        </p>
      </div>
    </StatusScreen>
  );
}

function SetupRequiredScreen({
  profile,
  steps,
  title,
  message,
  details,
}: {
  profile: InstallGuideProfile;
  steps: SetupStep[];
  title: string;
  message: string;
  details: string;
}) {
  return (
    <StatusScreen
      title={title}
      description={message}
      icon={<AlertCircle className="h-6 w-6 text-amber-600" />}
      iconTone="warning"
      widthClass="max-w-2xl"
      actions={
        <Button
          type="button"
          onClick={() => window.open(APP_STUDIO_URL, "_blank", "noopener,noreferrer")}
        >
          Open App Studio
          <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge colorScheme="neutral">{profile.extensionLabel}</Badge>
          <Badge colorScheme="warning">Setup Required</Badge>
        </div>
        <p className="text-center text-sm text-muted-foreground">{details}</p>
        <div className="rounded-lg border bg-muted/30 p-4 text-left">
          <ol className="space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3 py-1">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {step.value && (
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <code className="flex-1 min-w-0 block overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs text-foreground break-all">
                        {step.value}
                      </code>
                      {step.copyableValue && (
                        <CopyValueButton value={step.copyableValue} />
                      )}
                    </div>
                  )}
                  {step.choices && step.choices.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {step.choices.map((choice: InstallGuideChoice) => (
                        <div
                          key={choice.label}
                          className="rounded-md border bg-background px-3 py-2"
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
                  {step.linkHref && step.linkLabel && (
                    <a
                      href={step.linkHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {step.linkLabel}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </StatusScreen>
  );
}

function ConnectionErrorScreen({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <StatusScreen
      title={title}
      description={message}
      icon={<AlertCircle className="h-6 w-6 text-destructive" />}
      iconTone="destructive"
      widthClass="max-w-md"
      actions={
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      <p className="text-center text-sm text-muted-foreground">
        If this problem continues, confirm the app is installed correctly and opened from Sitecore App Studio.
      </p>
    </StatusScreen>
  );
}

function StatusScreen({
  title,
  description,
  icon,
  iconTone,
  widthClass,
  children,
  actions,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  iconTone: "primary" | "warning" | "destructive";
  widthClass: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const toneClass =
    iconTone === "warning"
      ? "bg-amber-100"
      : iconTone === "destructive"
      ? "bg-destructive/10"
      : "bg-primary/10";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className={"w-full " + widthClass}>
        <CardHeader className="text-center">
          <div className={"mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full " + toneClass}>
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {actions && (
            <div className="flex justify-center">
              {actions}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;

const INSTALL_GUIDE_PROFILE_TS = `import marketplaceManifest from "@/marketplace-manifest.json";

export const APP_STUDIO_URL = "https://portal.sitecorecloud.io/app-studio";

export type ExtensionPoint =
  | "standalone"
  | "xmc:pages:contextpanel"
  | "xmc:pages:customfield"
  | "xmc:dashboardblocks"
  | "xmc:fullscreen";

export interface InstallGuideChoice {
  label: string;
  selected: boolean;
  reason: string;
}

export interface InstallGuideProfile {
  appName: string;
  appTypeLabel: string;
  extensionPoint: ExtensionPoint;
  extensionLabel: string;
  registerDesc: string;
  installOpenDesc: string;
  apiAccess: InstallGuideChoice[];
  permissions: InstallGuideChoice[];
}

export interface SetupStep {
  title: string;
  description: string;
  value?: string;
  copyableValue?: string;
  linkLabel?: string;
  linkHref?: string;
  choices?: InstallGuideChoice[];
}

const EXTENSION_LABELS: Record<ExtensionPoint, string> = {
  standalone: "Standalone",
  "xmc:pages:contextpanel": "Page Context Panel",
  "xmc:pages:customfield": "Custom Field",
  "xmc:dashboardblocks": "Dashboard Widgets",
  "xmc:fullscreen": "Full Screen",
};

const EXTENSION_INSTRUCTIONS: Record<
  ExtensionPoint,
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

function getExtensionPointFromManifest(): ExtensionPoint {
  const extensionPoint = Array.isArray(marketplaceManifest.extensionPoints)
    ? marketplaceManifest.extensionPoints[0]
    : undefined;

  switch (extensionPoint) {
    case "xmc:pages:contextpanel":
    case "xmc:pages:customfield":
    case "xmc:dashboardblocks":
    case "xmc:fullscreen":
    case "standalone":
      return extensionPoint;
    default:
      return "standalone";
  }
}

function usesSitecoreApis(): boolean {
  return Array.isArray(marketplaceManifest.permissions)
    ? marketplaceManifest.permissions.some(
        (permission) =>
          typeof permission === "string" &&
          (permission.startsWith("xmc:") || permission.startsWith("sitecore"))
      )
    : false;
}

export function buildInstallGuideProfileFromManifest(): InstallGuideProfile {
  const extensionPoint = getExtensionPointFromManifest();
  const instructions = EXTENSION_INSTRUCTIONS[extensionPoint];
  const appName =
    typeof marketplaceManifest.name === "string" &&
    marketplaceManifest.name.trim().length > 0
      ? marketplaceManifest.name
      : "Generated Marketplace App";

  return {
    appName,
    appTypeLabel: "Custom app",
    extensionPoint,
    extensionLabel: EXTENSION_LABELS[extensionPoint],
    registerDesc: instructions.registerDesc,
    installOpenDesc: instructions.installOpenDesc,
    apiAccess: [
      {
        label: "SitecoreAI APIs",
        selected: usesSitecoreApis(),
        reason: usesSitecoreApis()
          ? "Selected because this app requests Sitecore authoring, preview, or live content access."
          : "Leave unselected if this generated app does not request Sitecore API permissions.",
      },
      {
        label: "AI skills APIs",
        selected: false,
        reason:
          "Leave unselected. This generated app does not currently infer AI skills API usage from the selected features.",
      },
    ],
    permissions: [
      {
        label: "Pop-ups",
        selected: true,
        reason:
          "Selected because the generated setup guide can open App Studio and related links in a new tab.",
      },
      {
        label: "Copy to clipboard",
        selected: true,
        reason:
          "Selected because the generated setup guide includes copy actions for the app name and deployment URL.",
      },
      {
        label: "Read from clipboard",
        selected: false,
        reason:
          "Leave unselected unless you intentionally add pasted-input behavior that reads from the clipboard.",
      },
    ],
  };
}

export function buildSetupStepsFromManifest(
  deploymentUrl: string
): SetupStep[] {
  const profile = buildInstallGuideProfileFromManifest();

  return [
    {
      title: "Create the app entry",
      description:
        "In App Studio, choose " +
        profile.appTypeLabel +
        " and use the app name below when creating the app.",
      value: profile.appName,
      copyableValue: profile.appName,
      linkLabel: "Open App Studio",
      linkHref: APP_STUDIO_URL,
    },
    {
      title: "Open the app configuration",
      description:
        "After creating the app, App Studio redirects you to the new entry. Open that app entry again any time you need to update its configuration.",
    },
    {
      title: "Select extension point",
      description: profile.registerDesc,
      value: profile.extensionLabel,
      copyableValue: profile.extensionLabel,
    },
    {
      title: "Select API access",
      description:
        "Under API access, choose the options below based on the generated app capabilities.",
      choices: profile.apiAccess,
    },
    {
      title: "Select app permissions",
      description:
        "Under permissions, enable only the toggles below that the generated app is expected to use.",
      choices: profile.permissions,
    },
    {
      title: "Paste the deployment URL",
      description: "Use the deployment URL below in the URL field.",
      value: deploymentUrl,
      copyableValue: deploymentUrl,
    },
    {
      title: "Upload an app logo",
      description:
        "Upload one square JPG, PNG, or SVG logo file. The maximum file size is 4MB.",
    },
    {
      title: "Activate the app",
      description:
        "After configuration is complete, click Activate in App Studio.",
    },
    {
      title: "Install and open",
      description:
        "After activating, install the app to the desired instance. " +
        profile.installOpenDesc,
    },
  ];
}
`;

const APP_FEATURE_TSX = `"use client";

import type { ClientSDK } from "@sitecore-marketplace-sdk/client";

export function AppFeature({ client }: { client: ClientSDK }) {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">App Connected</h1>
      <p className="text-sm text-muted-foreground mt-1">
        SDK initialized successfully. This is the default placeholder.
      </p>
    </div>
  );
}

export default AppFeature;
`;

const USE_MARKETPLACE_CLIENT = `"use client";

import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

export interface MarketplaceClientState {
  client: ClientSDK | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
}

const DEFAULT_OPTIONS = { retryAttempts: 3, retryDelay: 1000, autoInit: true };

let cachedClient: ClientSDK | undefined = undefined;

function isSetupRequiredError(error: Error): boolean {
  const errorWithCode = error as Error & { code?: string };
  const code = errorWithCode.code?.toUpperCase();
  const message = error.message.toLowerCase();

  return (
    code === "INVALID_ORIGIN" ||
    code === "TIMEOUT" ||
    code === "HANDSHAKE_FAILED" ||
    code === "CONNECTION_ERROR" ||
    message.includes("invalid message origin") ||
    message.includes("request timed out") ||
    message.includes("failed to establish connection")
  );
}

async function getMarketplaceClient(): Promise<ClientSDK> {
  if (cachedClient) return cachedClient;

  if (typeof window === "undefined") {
    throw new Error("Marketplace SDK can only initialize in the browser.");
  }

  cachedClient = await ClientSDK.init({ target: window.parent, modules: [XMC] });
  return cachedClient;
}

export function useMarketplaceClient(options: { retryAttempts?: number; retryDelay?: number; autoInit?: boolean } = {}) {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const [state, setState] = useState<MarketplaceClientState>({ client: null, error: null, isLoading: false, isInitialized: false });
  const isInitializingRef = useRef(false);

  const initializeClient = useCallback(async (attempt = 1): Promise<void> => {
    let shouldProceed = false;
    setState((prev) => {
      if (prev.isLoading || prev.isInitialized || isInitializingRef.current) return prev;
      shouldProceed = true;
      isInitializingRef.current = true;
      return { ...prev, isLoading: true, error: null };
    });
    if (!shouldProceed) return;

    try {
      const client = await getMarketplaceClient();
      setState({ client, error: null, isLoading: false, isInitialized: true });
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("Failed to initialize MarketplaceClient");

      if (!isSetupRequiredError(normalizedError) && attempt < opts.retryAttempts) {
        await new Promise((r) => setTimeout(r, opts.retryDelay));
        isInitializingRef.current = false;
        return initializeClient(attempt + 1);
      }
      setState({ client: null, error: normalizedError, isLoading: false, isInitialized: false });
    } finally {
      isInitializingRef.current = false;
    }
  }, [opts.retryAttempts, opts.retryDelay]);

  useEffect(() => {
    if (opts.autoInit && typeof window !== "undefined") initializeClient();
    return () => { isInitializingRef.current = false; };
  }, [opts.autoInit, initializeClient]);

  return useMemo(() => ({ ...state, initialize: initializeClient }), [state, initializeClient]);
}
`;

const USE_PAGE_CONTEXT = `"use client";

import { useEffect, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";

interface PageContext {
  pageInfo?: { id: string; name: string; path: string; language?: string; route?: string };
  siteInfo?: { id: string; name: string; language: string };
}

interface UsePageContextReturn {
  pageContext: PageContext | null;
  isLoading: boolean;
  error: string | null;
}

export function usePageContext(client: ClientSDK | null): UsePageContextReturn {
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const { data } = await client.query("pages.context");
        setPageContext(data);
        setIsLoading(false);
        unsubscribe = client.subscribe("pages.context", {
          onUpdate: (newData) => setPageContext(newData),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get page context");
        setIsLoading(false);
      }
    };

    init();
    return () => { unsubscribe?.(); };
  }, [client]);

  return { pageContext, isLoading, error };
}
`;

const ERROR_DISPLAY = `"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ title, message, details, onRetry }: ErrorDisplayProps) {
  return (
    <div className="p-6">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {(details || onRetry) && (
          <CardContent className="space-y-3">
            {details && <p className="text-sm text-muted-foreground">{details}</p>}
            {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
`;

const LIB_UTILS = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`;

const BUTTON_TSX = `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-4xl",
        sm: "h-8 rounded-4xl px-3 text-xs",
        lg: "h-10 rounded-4xl px-8",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
`;

const CARD_TSX = `import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
`;

const BADGE_TSX = `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white shadow",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
`;

const INPUT_TSX = `import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
  return (
    <input type={type} className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)} ref={ref} {...props} />
  );
});
Input.displayName = "Input";

export { Input };
`;

const SKELETON_TSX = `import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
`;

const COMPONENTS_JSON = JSON.stringify(
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    style: "default",
    rsc: true,
    tsx: true,
    tailwind: {
      config: "tailwind.config.ts",
      css: "app/globals.css",
      baseColor: "slate",
      cssVariables: true,
    },
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
    },
  },
  null,
  2
);

const GITIGNORE = `node_modules
.next
.env*.local
`;

const TYPES_INDEX_STUB = `// types/index.ts — Generated app domain types
// This stub is a template placeholder. The AI will override this with real types.
// If unchanged, add your domain interfaces here manually.
`;

export function buildReadme(config: AppConfig): string {
  const steps: string[] = [];
  let stepNum = 1;
  const extensionLabel =
    config.extensionPoint === "xmc:pages:contextpanel"
      ? "Page Context Panel"
      : config.extensionPoint === "xmc:pages:customfield"
      ? "Custom Field"
      : config.extensionPoint === "xmc:dashboardblocks"
      ? "Dashboard Widgets"
      : config.extensionPoint === "xmc:fullscreen"
      ? "Full Screen"
      : "Standalone";
  const installOpenDesc =
    config.extensionPoint === "xmc:pages:contextpanel"
      ? "Install the app, then open a page in the Pages editor and find the app in the context panel."
      : config.extensionPoint === "xmc:pages:customfield"
      ? "Install the app, then add the custom field to a page template before editing pages in the Pages editor."
      : config.extensionPoint === "xmc:dashboardblocks"
      ? "Install the app, then add the widget to your SitecoreAI dashboard."
      : config.extensionPoint === "xmc:fullscreen"
      ? "Install the app, then open it from Sitecore navigation."
      : "Install the app, then open it from the Cloud Portal app launcher.";
  const usesSitecoreApis = config.features.some((feature) =>
    ["page-context", "graphql-read", "graphql-write", "live-content"].includes(
      feature
    )
  );

  steps.push(
    `${stepNum}. Install dependencies:\n   \`\`\`bash\n   npm install\n   \`\`\``
  );
  stepNum++;

  if (config.features.includes("external-api")) {
    steps.push(
      `${stepNum}. Create \`.env.local\` from \`.env.example\` and add your API keys.`
    );
    stepNum++;
  }

  steps.push(
    `${stepNum}. Start the development server:\n   \`\`\`bash\n   npm run dev\n   \`\`\``
  );
  stepNum++;

  steps.push(
    `${stepNum}. Create the app in Sitecore App Studio:\n   - Go to [Sitecore App Studio](https://portal.sitecorecloud.io/app-studio)\n   - Choose \`Custom app\`\n   - App name: \`${config.appName}\``
  );
  stepNum++;

  steps.push(
    `${stepNum}. Open the app configuration:\n   - After creating the app, App Studio redirects you to the new app entry.\n   - Open that app entry any time you need to update configuration.`
  );
  stepNum++;

  steps.push(
    `${stepNum}. Configure the extension point:\n   - Select \`${extensionLabel}\`\n   - ${installOpenDesc}`
  );
  stepNum++;

  steps.push(
    `${stepNum}. Configure API access:\n   - SitecoreAI APIs: \`${usesSitecoreApis ? "Select" : "Leave off"}\`\n   - AI skills APIs: \`Leave off\``
  );
  stepNum++;

  steps.push(
    `${stepNum}. Configure app permissions:\n   - Pop-ups: \`Select\`\n   - Copy to clipboard: \`Select\`\n   - Read from clipboard: \`Leave off\``
  );
  stepNum++;

  steps.push(
    `${stepNum}. Paste the deployment URL:\n   - Use \`http://localhost:3000\` for local development or your deployed Vercel URL in production.`
  );
  stepNum++;

  steps.push(
    `${stepNum}. Upload the app logo:\n   - Upload one square JPG, PNG, or SVG logo file.\n   - Maximum size: 4MB.`
  );
  stepNum++;

  steps.push(
    `${stepNum}. Activate and install:\n   - Click \`Activate\`\n   - Return to App Studio and install the app to the desired environment\n   - ${installOpenDesc}`
  );
  stepNum++;

  steps.push(
    `${stepNum}. Direct-open behavior:\n   - If you open the deployed URL in a regular browser before installing the app in Sitecore, the generated app shows an in-app setup guide.\n   - Use that screen to confirm the deployment URL, app name, and App Studio selections.`
  );

  return `# ${config.appName}

${config.description || "A Sitecore Marketplace App"}

Generated by [Vibecore Studio](https://github.com/Sitecore-Hackathon/2026-Sitecorepunk-2077) — Sitecore Marketplace App Builder.

## Setup

${steps.join("\n\n")}

## Tech Stack

- Next.js 15+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS + Sitecore Blok components
- Sitecore Marketplace SDK
`;
}

/** Paths that must NEVER be overridden by LLM-generated files. */
export const PROTECTED_TEMPLATE_PATHS = new Set([
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "components/MarketplaceApp.tsx",
  "hooks/useMarketplaceClient.ts",
  "hooks/usePageContext.ts",
  "components/ErrorDisplay.tsx",
  "components/ui/button.tsx",
  "components/ui/card.tsx",
  "components/ui/badge.tsx",
  "components/ui/input.tsx",
  "components/ui/skeleton.tsx",
  "lib/utils.ts",
  "lib/install-guide-profile.ts",
]);

export function getTemplateFiles(config: AppConfig): Record<string, string> {
  const files: Record<string, string> = {
    "package.json": buildPackageJson(config),
    "next.config.js": NEXT_CONFIG,
    "tsconfig.json": TSCONFIG,
    "tailwind.config.ts": TAILWIND_CONFIG,
    "postcss.config.js": POSTCSS_CONFIG,
    "components.json": COMPONENTS_JSON,
    "app/globals.css": GLOBALS_CSS,
    "app/layout.tsx": LAYOUT_TSX,
    "app/page.tsx": PAGE_TSX,
    "components/MarketplaceApp.tsx": MARKETPLACE_APP_TSX,
    "components/AppFeature.tsx": APP_FEATURE_TSX,
    "hooks/useMarketplaceClient.ts": USE_MARKETPLACE_CLIENT,
    "hooks/usePageContext.ts": USE_PAGE_CONTEXT,
    "components/ErrorDisplay.tsx": ERROR_DISPLAY,
    "components/ui/button.tsx": BUTTON_TSX,
    "components/ui/card.tsx": CARD_TSX,
    "components/ui/badge.tsx": BADGE_TSX,
    "components/ui/input.tsx": INPUT_TSX,
    "components/ui/skeleton.tsx": SKELETON_TSX,
    "lib/utils.ts": LIB_UTILS,
    "lib/install-guide-profile.ts": INSTALL_GUIDE_PROFILE_TS,
    "marketplace-manifest.json": buildManifest(config),
    "vercel.json": VERCEL_JSON,
    ".gitignore": GITIGNORE,
    "types/index.ts": TYPES_INDEX_STUB,
    "README.md": buildReadme(config),
  };

  if (config.features.includes("external-api")) {
    files[".env.example"] = "# Add your API keys here (server-side only)\n# EXTERNAL_API_KEY=your-key-here\n";
  }

  return files;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Rocket, ChevronRight } from "lucide-react";

const STORAGE_KEY = "vibecore-welcome-dismissed";

interface WelcomeStep {
  icon: React.ReactNode;
  headline: string;
  body: string;
  tip?: string;
}

const STEPS: WelcomeStep[] = [
  {
    icon: <Sparkles className="h-8 w-8 text-violet-500" />,
    headline: "You describe it. Vibecore builds it.",
    body: "Pick an extension point \u2014 context panel, full-screen, custom field, or standalone \u2014, give you app a name (and let AI populate or enhance it if you want), and select the Sitecore features it needs. Vibecore generates a complete Next.js marketplace app from your description.",
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
    headline: "Iterate in real-time.",
    body: "Review the generated code in the built-in editor. Use the Refine chat to tweak layouts, fix logic, add features, or change behavior \u2014 each refinement regenerates only what changed.",
  },
  {
    icon: <Rocket className="h-8 w-8 text-emerald-500" />,
    headline: "Ship it to Vercel. Install it in Sitecore App Studio.",
    body: "Deploy your app to Vercel in one click, then follow the Install Guide to register it in the Sitecore Marketplace portal. Your app runs inside SitecoreAI as an iframe extension.",
    tip: "Use Settings (\u2699) to connect your own Anthropic API key and Vercel token.",
  },
];

export function useWelcomeModal() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const dismiss = (dontShowAgain: boolean) => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setDismissed(true);
  };

  return { showWelcome: !dismissed, dismissWelcome: dismiss };
}

export function WelcomeModal({
  onDismiss,
}: {
  onDismiss: (dontShowAgain: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Welcome to Vibecore Studio"
    >
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header accent */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />

        <div className="p-6 space-y-5">
          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Welcome to Vibecore Studio</h2>
            <p className="text-xs text-muted-foreground">
              Build Sitecore Marketplace apps with AI
            </p>
          </div>

          {/* Step content */}
          <div className="flex flex-col items-center text-center space-y-3 min-h-[180px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              {current.icon}
            </div>
            <h3 className="text-base font-semibold">{current.headline}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.body}
            </p>
            {current.tip && (
              <p className="text-xs text-muted-foreground/70 italic">
                Tip: {current.tip}
              </p>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              <span className="text-xs text-muted-foreground">
                Don&apos;t show again
              </span>
            </label>

            <div className="flex items-center gap-2">
              {step === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onDismiss(dontShow)}
                >
                  Skip
                </Button>
              )}
              {step > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (isLast) {
                    onDismiss(dontShow);
                  } else {
                    setStep((s) => s + 1);
                  }
                }}
              >
                {isLast ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/40 select-none pt-1">
            Vibecore Studio · 2026 Sitecore Hackathon · Team Sitecorepunk2077
          </p>
        </div>
      </div>
    </div>
  );
}

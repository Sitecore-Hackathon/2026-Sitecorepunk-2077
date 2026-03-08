"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

const LOADING_MESSAGES = [
  "Vibing...",
  "Scoping...",
  "Accelerating...",
  "Light-speed mode activated...",
  "Processing at 110%...",
  "Crunching data...",
  "Generating code...",
  "Validating imports...",
  "Auto-fixing if needed...",
  "Please be patient...",
  "Just a moment...",
  "Warming up the engines...",
  "Checking dependencies...",
  "Aligning semicolons...",
  "Tuning parameters...",
  "Spinning up threads...",
  "Consulting the docs...",
  "Refactoring reality...",
  "Summoning functions...",
  "Hydrating state...",
  "Parsing the universe...",
  "Mapping variables...",
  "Compiling thoughts...",
  "Reindexing neurons...",
  "Normalizing inputs...",
  "Optimizing loops...",
  "Resolving promises...",
  "Balancing brackets...",
  "Aligning curly braces...",
  "Eliminating race conditions...",
  "Rendering possibilities...",
  "Polishing syntax...",
  "Fetching inspiration...",
  "Traversing graphs...",
  "Linking modules...",
  "Calibrating logic...",
  "Batching requests...",
  "Negotiating with APIs...",
  "Simulating outcomes...",
  "Folding time complexity...",
  "Preparing payload...",
  "Validating schema...",
  "Inspecting stack...",
  "Debugging destiny...",
  "Flattening arrays...",
  "Calculating paths...",
  "Weighing edge cases...",
  "Spawning helpers...",
  "De-duplicating ideas...",
  "Stitching responses...",
  "Measuring latency...",
  "Routing packets...",
  "Tracing execution...",
  "Checking invariants...",
  "Building ASTs...",
  "Tokenizing thoughts...",
  "Interpreting signals...",
  "Running heuristics...",
  "Aligning bitstreams...",
  "Compacting memory...",
  "Defragmenting logic...",
  "Allocating buffers...",
  "Sampling entropy...",
  "Tuning hyperparameters...",
  "Simmering algorithms...",
  "Sharpening queries...",
  "Folding constants...",
  "Hoisting variables...",
  "Waking the cache...",
  "Clearing stale state...",
  "Reconciling diffs...",
  "Enumerating options...",
  "Walking the tree...",
  "Solving constraints...",
  "Balancing load...",
  "Scaling horizontally...",
  "Synchronizing clocks...",
  "Preparing output...",
  "Filtering noise...",
  "Checking assumptions...",
  "Verifying integrity...",
  "Stress testing ideas...",
  "Calculating gradients...",
  "Sampling possibilities...",
  "Predicting next steps...",
  "Drafting responses...",
  "Polishing sentences...",
  "Finalizing structure...",
  "Preparing delivery...",
  "Almost there...",
  "Final pass...",
];

const PROGRESS_TARGET = 93;
const PROGRESS_TIME_CONSTANT_MS = 75000; // ~75s to reach ~63%, ~150s for ~86%, ~300s for ~93%

function calcProgress(elapsedMs: number): number {
  return Math.min(
    PROGRESS_TARGET,
    PROGRESS_TARGET * (1 - Math.exp(-elapsedMs / PROGRESS_TIME_CONSTANT_MS))
  );
}

export interface GeneratingLoadingContentProps {
  title: string;
  subtitle: string;
  /** When set, overrides the calculated progress (e.g. 100 for completion) */
  progressOverride?: number;
}

export function GeneratingLoadingContent({
  title,
  subtitle,
  progressOverride,
}: GeneratingLoadingContentProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  // Cycle messages with fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Advance fake progress bar (or use override)
  useEffect(() => {
    if (progressOverride !== undefined) {
      setProgress(progressOverride);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(calcProgress(elapsed));
    }, 200);
    return () => clearInterval(interval);
  }, [progressOverride]);

  return (
    <div className="text-center space-y-6 max-w-sm w-full">
      <Sparkles className="h-10 w-10 text-primary mx-auto" />
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* Cycling message */}
      <p
        className="text-sm font-medium text-primary transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </p>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getTemplateFiles } from "@/lib/templates";
import { X } from "lucide-react";
import * as Diff from "diff";
import type { GenerationVersion, GeneratedFile } from "@/types";

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function getTemplateFileMap(version: GenerationVersion): Map<string, string> {
  const map = new Map<string, string>();
  const templateFiles = getTemplateFiles(version.config);
  for (const [path, content] of Object.entries(templateFiles)) {
    map.set(normalizePath(path), content);
  }
  return map;
}

function getEffectiveFileMap(version: GenerationVersion): Map<string, string> {
  const map = getTemplateFileMap(version);
  for (const f of version.files) {
    map.set(normalizePath(f.path), f.content);
  }
  return map;
}

function getVersionNumber(
  version: GenerationVersion,
  allVersions?: GenerationVersion[]
): number | null {
  if (!allVersions || allVersions.length === 0) return null;
  const index = allVersions.findIndex((candidate) => candidate.id === version.id);
  return index >= 0 ? allVersions.length - index : null;
}

function formatVersionLabel(
  version: GenerationVersion,
  allVersions?: GenerationVersion[]
): string {
  const versionNumber = getVersionNumber(version, allVersions);
  return versionNumber != null ? `Version ${versionNumber}` : "Version";
}

interface DiffFileInfo {
  path: string;
  status: "only-a" | "only-b" | "changed" | "unchanged";
}

interface VersionDiffViewProps {
  versionA: GenerationVersion;
  versionB: GenerationVersion;
  allVersions?: GenerationVersion[];
  selectedIdA?: string;
  selectedIdB?: string;
  onSelectA?: (id: string) => void;
  onSelectB?: (id: string) => void;
  onClose?: () => void;
}

export function VersionDiffView({
  versionA,
  versionB,
  allVersions,
  selectedIdA,
  selectedIdB,
  onSelectA,
  onSelectB,
  onClose,
}: VersionDiffViewProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const mapA = useMemo(() => getEffectiveFileMap(versionA), [versionA]);
  const mapB = useMemo(() => getEffectiveFileMap(versionB), [versionB]);

  const { diffFiles, hasDifferences } = useMemo(() => {
    const allPaths = new Set([...mapA.keys(), ...mapB.keys()]);
    const diffFiles: DiffFileInfo[] = [];

    for (const path of allPaths) {
      const contentA = mapA.get(path);
      const contentB = mapB.get(path);
      if (!contentA && contentB) {
        diffFiles.push({ path, status: "only-b" });
      } else if (contentA && !contentB) {
        diffFiles.push({ path, status: "only-a" });
      } else if (contentA && contentB) {
        const changed = contentA !== contentB;
        diffFiles.push({
          path,
          status: changed ? "changed" : "unchanged",
        });
      }
    }

    const differing = diffFiles.filter(
      (f) => f.status === "only-a" || f.status === "only-b" || f.status === "changed"
    );
    const hasDifferences = differing.length > 0;

    return {
      diffFiles: differing.length > 0 ? differing : diffFiles,
      hasDifferences,
    };
  }, [mapA, mapB]);

  const selectedDiffContent = useMemo(() => {
    if (!selectedPath) return null;
    const contentA = mapA.get(selectedPath);
    const contentB = mapB.get(selectedPath);

    if (!contentA && contentB) {
      return { type: "only-b" as const, content: contentB };
    }
    if (contentA && !contentB) {
      return { type: "only-a" as const, content: contentA };
    }
    if (contentA && contentB) {
      return {
        type: "diff" as const,
        changes: Diff.diffLines(contentA, contentB),
      };
    }
    return null;
  }, [selectedPath, mapA, mapB]);

  const effectiveSelectedPath =
    selectedPath && diffFiles.some((f) => f.path === selectedPath)
      ? selectedPath
      : diffFiles[0]?.path ?? null;

  useEffect(() => {
    if (effectiveSelectedPath && effectiveSelectedPath !== selectedPath) {
      setSelectedPath(effectiveSelectedPath);
    }
  }, [effectiveSelectedPath, selectedPath]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0 flex-wrap">
            {allVersions && onSelectA && selectedIdA != null ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Version A:</span>
                <select
                  className="text-xs border rounded px-2 py-1 bg-background"
                  value={selectedIdA}
                  onChange={(e) => onSelectA(e.target.value)}
                >
                  {allVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatVersionLabel(v, allVersions)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-sm">
                <span className="text-muted-foreground">Version A: </span>
                <span className="font-medium">
                  {formatVersionLabel(versionA, allVersions)}
                </span>
              </div>
            )}
            <span className="text-muted-foreground">vs</span>
            {allVersions && onSelectB && selectedIdB != null ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Version B:</span>
                <select
                  className="text-xs border rounded px-2 py-1 bg-background"
                  value={selectedIdB}
                  onChange={(e) => onSelectB(e.target.value)}
                >
                  {allVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatVersionLabel(v, allVersions)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-sm">
                <span className="text-muted-foreground">Version B: </span>
                <span className="font-medium">
                  {formatVersionLabel(versionB, allVersions)}
                </span>
              </div>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!hasDifferences ? (
          <div className="flex-1 p-8 text-center text-muted-foreground">
            No differences between these versions.
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 px-4 py-2 border-b">
              <select
                className="text-xs font-mono w-full max-w-md border rounded px-2 py-1.5 bg-background"
                value={effectiveSelectedPath ?? ""}
                onChange={(e) => setSelectedPath(e.target.value || null)}
              >
                {diffFiles.map((f) => (
                  <option key={f.path} value={f.path}>
                    {f.path}
                    {f.status === "only-a" && " (removed in B)"}
                    {f.status === "only-b" && " (added in B)"}
                    {f.status === "changed" && " (modified)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-auto p-4 min-h-0">
              {selectedDiffContent?.type === "only-a" && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    Only in Version A (removed in B)
                  </p>
                  <pre className="text-xs font-mono bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
                    {selectedDiffContent.content}
                  </pre>
                </div>
              )}
              {selectedDiffContent?.type === "only-b" && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    Only in Version B (added)
                  </p>
                  <pre className="text-xs font-mono bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto">
                    {selectedDiffContent.content}
                  </pre>
                </div>
              )}
              {selectedDiffContent?.type === "diff" && (
                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto bg-muted/30 p-3 rounded">
                  {selectedDiffContent.changes.map((part, i) => {
                    if (part.added) {
                      return (
                        <span
                          key={i}
                          className="block bg-green-500/20 text-green-800 dark:text-green-200"
                        >
                          {part.value
                            .split("\n")
                            .map((line, j) =>
                              line ? (
                                <span key={j}>
                                  +{line}
                                  {"\n"}
                                </span>
                              ) : (
                                "\n"
                              )
                            )}
                        </span>
                      );
                    }
                    if (part.removed) {
                      return (
                        <span
                          key={i}
                          className="block bg-red-500/20 text-red-800 dark:text-red-200"
                        >
                          {part.value
                            .split("\n")
                            .map((line, j) =>
                              line ? (
                                <span key={j}>
                                  -{line}
                                  {"\n"}
                                </span>
                              ) : (
                                "\n"
                              )
                            )}
                        </span>
                      );
                    }
                    return (
                      <span key={i} className="text-foreground/80">
                        {part.value
                          .split("\n")
                          .map((line, j) =>
                            line ? (
                              <span key={j}>
                                {line}
                                {"\n"}
                              </span>
                            ) : (
                              "\n"
                            )
                          )}
                      </span>
                    );
                  })}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

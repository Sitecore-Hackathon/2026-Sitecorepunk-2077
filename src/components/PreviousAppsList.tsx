"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, History, ChevronRight, Trash2, X } from "lucide-react";
import {
  deleteAppBySlug,
  getAllStoredApps,
  type StoredAppSummary,
} from "@/lib/generation-history";

function formatRelativeTime(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

interface PreviousAppsListProps {
  onOpenApp: (slug: string) => void;
}

export function PreviousAppsList({ onOpenApp }: PreviousAppsListProps) {
  const [apps, setApps] = useState<StoredAppSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [pendingDeleteApp, setPendingDeleteApp] = useState<StoredAppSummary | null>(
    null
  );

  useEffect(() => {
    setApps(getAllStoredApps());
  }, []);

  const refreshApps = (): void => {
    setApps(getAllStoredApps());
  };

  const handleDeleteApp = (): void => {
    if (!pendingDeleteApp) return;
    deleteAppBySlug(pendingDeleteApp.slug);
    refreshApps();
    setPendingDeleteApp(null);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          refreshApps();
          setOpen(true);
        }}
        className="h-8 gap-1.5 whitespace-nowrap"
      >
        <History className="h-3.5 w-3.5" />
        Previous Apps
        <span className="text-xs text-muted-foreground">({apps.length})</span>
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
          aria-label="Previous apps"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close previous apps"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-card border-l shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Previous Apps
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reopen one of your recent generated apps.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y">
              {apps.length === 0 ? (
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  No previous apps found on this device yet.
                  </div>
              ) : (
                apps.map((app) => (
                  <div
                    key={app.slug}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{app.appName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(app.timestamp)}
                        {app.versionCount > 1 && (
                          <> · {app.versionCount} versions</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDeleteApp(app)}
                        aria-label={`Delete ${app.appName}`}
                        title={`Delete ${app.appName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs shrink-0"
                        onClick={() => {
                          onOpenApp(app.slug);
                          setOpen(false);
                        }}
                      >
                        Open
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {pendingDeleteApp && (
        <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setPendingDeleteApp(null)}
            aria-label="Close delete app confirmation"
          />
          <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4">
            <div className="rounded-lg border bg-card shadow-xl">
              <div className="flex items-start gap-3 border-b px-5 py-4">
                <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">Delete App</h2>
                  <p className="text-sm text-muted-foreground">
                    Delete all saved history for `{pendingDeleteApp.appName}` on this
                    device?
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4 text-sm text-muted-foreground">
                <p>
                  This removes {pendingDeleteApp.versionCount} saved version
                  {pendingDeleteApp.versionCount === 1 ? "" : "s"} for this app from
                  local storage.
                </p>
                <p>
                  Deployed apps are not removed, but you will lose the saved local
                  review history for this app.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingDeleteApp(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteApp}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete App
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

export default function DownloadBridgePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const downloadId = typeof params.id === "string" ? params.id : "";
  const filename = searchParams.get("filename") ?? "your ZIP file";

  const downloadPath = useMemo(() => {
    if (!downloadId) return "";
    return `/api/download/${downloadId}`;
  }, [downloadId]);

  useEffect(() => {
    if (!downloadPath) return;

    const timer = window.setTimeout(() => {
      window.location.replace(downloadPath);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [downloadPath]);

  return (
    <main className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Download starting
          </CardTitle>
          <CardDescription>
            Preparing <span className="font-medium text-foreground">{filename}</span>.
            If nothing happens, use the button below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              if (downloadPath) {
                window.location.assign(downloadPath);
              }
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Download again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Pencil, RotateCcw, Save } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { GeneratedFile } from "@/types";

interface CodeFileViewerProps {
  file: GeneratedFile;
  isTemplate?: boolean;
  onSave?: (file: GeneratedFile) => void;
}

function getLanguage(path: string): string {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "javascript";
  if (path.endsWith(".env") || path.endsWith(".env.example")) return "bash";
  if (path.endsWith(".gitignore")) return "bash";
  return "text";
}

export function CodeFileViewer({
  file,
  isTemplate,
  onSave,
}: CodeFileViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(file.content);

  useEffect(() => {
    setDraftContent(file.content);
    setIsEditing(false);
  }, [file.path, file.content]);

  const hasUnsavedChanges = draftContent !== file.content;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? draftContent : file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = () => {
    setDraftContent(file.content);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!onSave || !hasUnsavedChanges) {
      setIsEditing(false);
      return;
    }

    onSave({
      path: file.path,
      content: draftContent,
    });
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground truncate">
            {file.path}
          </span>
          {isTemplate && (
            <Badge colorScheme="neutral" size="sm" className="shrink-0 text-[10px]">
              Template
            </Badge>
          )}
          {isEditing && (
            <Badge colorScheme="primary" size="sm" className="shrink-0 text-[10px]">
              Editing
            </Badge>
          )}
          {!isEditing && hasUnsavedChanges && (
            <Badge colorScheme="warning" size="sm" className="shrink-0 text-[10px]">
              Unsaved
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="ml-1 text-xs">Cancel</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="h-7 px-2"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="ml-1 text-xs">Save</span>
              </Button>
            </>
          ) : (
            <>
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs">Edit</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          spellCheck={false}
          className="min-h-[500px] w-full resize-y border-0 bg-background p-4 font-mono text-xs leading-6 outline-none"
        />
      ) : (
        <SyntaxHighlighter
          language={getLanguage(file.path)}
          style={oneLight}
          showLineNumbers
          customStyle={{
            margin: 0,
            fontSize: "0.75rem",
            lineHeight: "1.5",
            maxHeight: "725px",
            borderRadius: 0,
            background: "transparent",
          }}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "hsl(215.4 16.3% 46.9%)",
            userSelect: "none",
          }}
        >
          {file.content}
        </SyntaxHighlighter>
      )}
    </div>
  );
}

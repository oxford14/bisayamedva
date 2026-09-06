"use client";

import { useRef } from "react";
import { Maximize2 } from "lucide-react";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { ModulePdfViewer } from "@/components/member/module-pdf-viewer";
import { isVideoMime } from "@/lib/modules/storage";
import type { StudentModuleFile } from "@/lib/member/modules";

export function ModulePlayerViewer({ file }: { file: StudentModuleFile }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const video = isVideoMime(file.mimeType);
  const pdf = file.mimeType === "application/pdf";

  async function goFullscreen() {
    const node = frameRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {file.url && (pdf || video) ? (
        <div className="mb-3 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={goFullscreen}>
            <Maximize2 className="size-3.5" aria-hidden />
            {modulesCopy.fullscreen}
          </Button>
        </div>
      ) : null}
      <div
        ref={frameRef}
        className="min-h-[28rem] flex-1 overflow-hidden rounded-2xl border border-border bg-white"
      >
        {!file.url ? (
          <p className="p-6 text-sm text-muted">{modulesCopy.noFiles}</p>
        ) : video ? (
          <video
            className="h-full w-full bg-ink"
            src={file.url}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            preload="metadata"
            onContextMenu={(event) => event.preventDefault()}
          />
        ) : pdf ? (
          <ModulePdfViewer src={file.url} />
        ) : (
          <div className="flex h-full min-h-[28rem] flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-md text-sm text-muted">{modulesCopy.viewAsPdf}</p>
          </div>
        )}
      </div>
    </div>
  );
}

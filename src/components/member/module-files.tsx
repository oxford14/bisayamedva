import { FileText, Film } from "lucide-react";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { formatByteSize, isVideoMime } from "@/lib/modules/storage";
import type { StudentModuleFile } from "@/lib/member/modules";

export function ModuleFiles({ files }: { files: StudentModuleFile[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-muted">{modulesCopy.noFiles}</p>;
  }

  return (
    <ul className="space-y-4">
      {files.map((file) => {
        const video = isVideoMime(file.mimeType);
        return (
          <li key={file.id} className="rounded-xl border border-border bg-cream/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-navy">
                {video ? (
                  <Film className="size-4" aria-hidden />
                ) : (
                  <FileText className="size-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{file.fileName}</p>
                <p className="text-xs text-muted">{formatByteSize(file.byteSize)}</p>
                {file.url && video ? (
                  <video
                    className="mt-3 w-full rounded-lg bg-ink"
                    src={file.url}
                    controls
                    preload="metadata"
                  />
                ) : null}
                {file.url ? (
                  <div className="mt-3">
                    <Button asChild variant="secondary" size="sm">
                      <a href={file.url} target="_blank" rel="noreferrer">
                        {video ? modulesCopy.openFile : modulesCopy.download}
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

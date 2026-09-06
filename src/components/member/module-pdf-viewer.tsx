"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

export function ModulePdfViewer({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.15);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const task = getDocument({ url: src, withCredentials: true });
    setLoading(true);
    setError(false);
    setPdf(null);
    setPage(1);
    task.promise
      .then((doc) => {
        if (cancelled) {
          void doc.cleanup();
          return;
        }
        setPdf(doc);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [src]);

  useEffect(() => {
    if (!pdf) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const render = async () => {
      const pdfPage = await pdf.getPage(page);
      if (cancelled) return;
      const viewport = pdfPage.getViewport({ scale: zoom });
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pdfPage.render({ canvasContext: context, canvas, viewport }).promise;
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [pdf, page, zoom]);

  if (error) {
    return <p className="p-6 text-sm text-muted">{modulesCopy.pdfError}</p>;
  }

  return (
    <div className="flex h-full min-h-[28rem] flex-col bg-sand/40">
      <div className="flex items-center justify-center gap-2 border-b border-border/70 bg-white px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!pdf || page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="min-w-[7rem] text-center text-sm font-medium text-navy">
          {modulesCopy.pageLabel} {page}
          {pdf ? ` / ${pdf.numPages}` : ""}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!pdf || page >= pdf.numPages}
          onClick={() =>
            setPage((current) => Math.min(pdf?.numPages ?? current, current + 1))
          }
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="mx-2 h-5 w-px bg-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP))}
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </Button>
        <p className="w-12 text-center text-sm font-medium text-navy">
          {Math.round(zoom * 100)}%
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP))}
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <p className="p-2 text-sm text-muted">{modulesCopy.pdfLoading}</p>
        ) : null}
        <canvas ref={canvasRef} className="mx-auto block max-w-full bg-white shadow-sm" />
      </div>
    </div>
  );
}

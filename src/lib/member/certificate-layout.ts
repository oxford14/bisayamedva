import { certificatesCopy } from "@/content/site";

export const CERTIFICATE_TEMPLATE_SRC =
  "/images/brand/certificate-template-v4-glossy.png";

export const CERTIFICATE_COLORS = {
  navy: "#2D4A22",
  ink: "#2F3826",
  muted: "#5A664F",
} as const;

export const CERTIFICATE_RENDER_SCALE = 2;

export function certificateBodyForSlug(slug: string) {
  const bySlug = certificatesCopy.certificateBodyBySlug;
  if (slug in bySlug) {
    return bySlug[slug as keyof typeof bySlug];
  }
  return certificatesCopy.certificateBody;
}

export function certificateCompletionParagraph(
  programTitle: string,
  slug: string,
) {
  return `${certificatesCopy.completedLead} ${programTitle}, ${certificateBodyForSlug(slug)}`;
}

export function certificateLayout(sheetW: number, sheetH: number) {
  const cx = sheetW / 2;
  const contentMaxW = sheetW * 0.62;
  const qrSize = Math.round(sheetH * 0.145);
  const qrX = sheetW * 0.045;
  const qrY = sheetH - qrSize - sheetH * 0.082;

  return {
    cx,
    contentMaxW,
    introY: sheetH * 0.392,
    nameY: sheetH * 0.448,
    bodyY: sheetH * 0.505,
    bodyLineHeight: sheetH * 0.026,
    metaY: sheetH * 0.72,
    metaColGap: contentMaxW * 0.35,
    qrSize,
    qrX,
    qrY,
    qrLabelMaxW: qrSize,
    signatureCenterX: sheetW * 0.78,
    signatureBaseY: sheetH * 0.84,
    signatureLineW: sheetW * 0.16,
    signatureImageW: sheetW * 0.12,
    signatureImageH: sheetH * 0.055,
    signatureGapAboveName: sheetH * 0.008,
    nameFontSize: sheetH * 0.048,
    nameLineHeight: sheetH * 0.055,
    bodyFontSize: sheetH * 0.021,
    introFontSize: sheetH * 0.024,
    metaLabelFontSize: sheetH * 0.016,
    metaValueFontSize: sheetH * 0.022,
    signatoryNameFontSize: sheetH * 0.026,
    signatoryTitleFontSize: sheetH * 0.018,
    qrLabelFontSize: sheetH * 0.017,
  };
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function fillCentered(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return lines.length * lineHeight;
}

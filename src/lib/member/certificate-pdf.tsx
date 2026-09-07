"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import { certificatesCopy } from "@/content/site";
import {
  formatCertificateDate,
  type MemberCertificate,
} from "@/lib/member/certificate-shared";
import { getCertificateVerifyUrl } from "@/lib/payments/pay-url";

const SHEET_W = 1100;
const SHEET_H = 850;
const SCALE = 2;
const BG = "#f5f6f0";
const NAVY = "#5b6d49";
const INK = "#2f3826";
const MUTED = "#66705a";
const BACKGROUND_SRC = "/images/brand/certificate-seal-v3.webp";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

function cssFont(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function wrapText(
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

function fillCentered(
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

function qrDataUrl(value: string, size: number) {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <QRCodeCanvas
          value={value}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#3F4A32"
          includeMargin
        />,
      );
    });
    const canvas = host.querySelector("canvas");
    if (!canvas) throw new Error("QR failed to render.");
    return canvas.toDataURL("image/png");
  } finally {
    root.unmount();
    host.remove();
  }
}

async function renderCertificateCanvas(
  certificate: MemberCertificate,
  studentName: string,
) {
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
  ]);
  const [background, qrImage] = await Promise.all([
    loadImage(BACKGROUND_SRC),
    loadImage(
      qrDataUrl(getCertificateVerifyUrl(certificate.certificateId), 128),
    ),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W * SCALE;
  canvas.height = SHEET_H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  ctx.drawImage(background, 0, 0, SHEET_W, SHEET_H);

  const display = cssFont("--font-fraunces", "Georgia, serif");
  const sans = cssFont("--font-plus-jakarta", "system-ui, sans-serif");
  const padL = 72;
  const padR = 210;
  const contentW = SHEET_W - padL - padR;
  const cx = padL + contentW / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = NAVY;
  ctx.font = `600 13px ${sans}`;
  ctx.letterSpacing = "0.22em";
  ctx.fillText("BISAYA MEDVA", cx, 78);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = INK;
  ctx.font = `600 42px ${display}`;
  ctx.fillText("Certificate of Completion", cx, 128);

  ctx.fillStyle = MUTED;
  ctx.font = `400 16px ${sans}`;
  ctx.fillText(certificatesCopy.certifies, cx, 250);

  ctx.fillStyle = NAVY;
  ctx.font = `600 42px ${display}`;
  fillCentered(ctx, wrapText(ctx, studentName, contentW), cx, 300, 48);

  ctx.fillStyle = MUTED;
  ctx.font = `400 16px ${sans}`;
  ctx.fillText(certificatesCopy.completed, cx, 368);

  ctx.fillStyle = INK;
  ctx.font = `600 28px ${display}`;
  const titleLines = wrapText(ctx, certificate.title, contentW);
  fillCentered(ctx, titleLines, cx, 408, 34);

  let afterTitle = 408 + titleLines.length * 34;
  if (certificate.subtitle) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 15px ${sans}`;
    afterTitle += 8;
    fillCentered(ctx, wrapText(ctx, certificate.subtitle, contentW), cx, afterTitle, 20);
    afterTitle += 24;
  }

  const metaY = Math.max(afterTitle + 36, 500);
  const col = contentW / 4;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(91, 109, 73, 0.7)";
  ctx.font = `600 10px ${sans}`;
  ctx.letterSpacing = "0.14em";
  ctx.fillText(certificatesCopy.dateLabel.toUpperCase(), cx - col * 1.4, metaY);
  ctx.fillText(certificatesCopy.idLabel.toUpperCase(), cx + col * 0.2, metaY);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = INK;
  ctx.font = `500 15px ${sans}`;
  ctx.fillText(formatCertificateDate(certificate.completedAt), cx - col * 1.4, metaY + 22);
  ctx.fillText(certificate.certificateId, cx + col * 0.2, metaY + 22);

  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(91, 109, 73, 0.3)";
  ctx.beginPath();
  ctx.moveTo(cx - 72, metaY + 70);
  ctx.lineTo(cx + 72, metaY + 70);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `600 18px ${display}`;
  ctx.fillText(certificatesCopy.signatoryName, cx, metaY + 94);
  ctx.fillStyle = MUTED;
  ctx.font = `500 11px ${sans}`;
  ctx.fillText(certificatesCopy.signatoryTitle, cx, metaY + 114);

  const qrSize = 88;
  const qrX = cx - qrSize / 2;
  const qrY = 668;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = INK;
  ctx.font = `500 11px ${sans}`;
  ctx.fillText(certificatesCopy.scanPrompt, cx, qrY + qrSize + 18);
  ctx.fillStyle = NAVY;
  ctx.font = `600 12px ${sans}`;
  ctx.letterSpacing = "0.2em";
  ctx.fillText(certificatesCopy.issued.toUpperCase(), cx, 828);
  ctx.letterSpacing = "0px";

  return canvas;
}

export function certificatePdfFilename(certificateId: string) {
  return `Bisaya-MedVA-Certificate-${certificateId}.pdf`;
}

export async function buildCertificatePdfBlob(
  certificate: MemberCertificate,
  studentName: string,
) {
  const canvas = await Promise.race([
    renderCertificateCanvas(certificate, studentName),
    new Promise<HTMLCanvasElement>((_, reject) =>
      window.setTimeout(() => reject(new Error("PDF render timed out.")), 20000),
    ),
  ]);
  const { jsPDF } = await import("jspdf");
  const image = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [11, 8.5],
  });
  pdf.addImage(image, "JPEG", 0, 0, 11, 8.5);
  return pdf.output("blob");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function captureCertificatePdf(
  certificate: MemberCertificate,
  studentName: string,
) {
  const blob = await buildCertificatePdfBlob(certificate, studentName);
  triggerDownload(blob, certificatePdfFilename(certificate.certificateId));
}

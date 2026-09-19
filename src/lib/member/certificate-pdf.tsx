"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import { certificatesCopy } from "@/content/site";
import {
  CERTIFICATE_COLORS,
  CERTIFICATE_RENDER_SCALE,
  CERTIFICATE_TEMPLATE_SRC,
  certificateCompletionParagraph,
  certificateLayout,
  fillCentered,
  wrapText,
} from "@/lib/member/certificate-layout";
import {
  formatCertificateDate,
  type MemberCertificate,
} from "@/lib/member/certificate-shared";
import { getCertificateVerifyUrl } from "@/lib/payments/pay-url";

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
          fgColor="#2D4A22"
          includeMargin={false}
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

async function loadOptionalImage(src: string | null | undefined) {
  if (!src) return null;
  try {
    return await loadImage(src);
  } catch {
    return null;
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

  const background = await loadImage(CERTIFICATE_TEMPLATE_SRC);
  const sheetW = background.naturalWidth;
  const sheetH = background.naturalHeight;
  const L = certificateLayout(sheetW, sheetH);
  const qrRenderSize = Math.max(256, Math.round(L.qrSize * 2));

  const [qrImage, signatureImage] = await Promise.all([
    loadImage(
      qrDataUrl(getCertificateVerifyUrl(certificate.certificateId), qrRenderSize),
    ),
    loadOptionalImage(certificatesCopy.signatureImageSrc),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = sheetW * CERTIFICATE_RENDER_SCALE;
  canvas.height = sheetH * CERTIFICATE_RENDER_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  ctx.scale(CERTIFICATE_RENDER_SCALE, CERTIFICATE_RENDER_SCALE);
  ctx.drawImage(background, 0, 0, sheetW, sheetH);

  const display = cssFont("--font-fraunces", "Georgia, serif");
  const sans = cssFont("--font-plus-jakarta", "system-ui, sans-serif");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = CERTIFICATE_COLORS.muted;
  ctx.font = `400 ${L.introFontSize}px ${sans}`;
  ctx.fillText(certificatesCopy.certifies, L.cx, L.introY);

  ctx.fillStyle = CERTIFICATE_COLORS.navy;
  ctx.font = `600 ${L.nameFontSize}px ${display}`;
  fillCentered(
    ctx,
    wrapText(ctx, studentName, L.contentMaxW),
    L.cx,
    L.nameY,
    L.nameLineHeight,
  );

  const programTitle =
    certificate.title || certificatesCopy.certificateProgramLine;
  const completionText = certificateCompletionParagraph(
    programTitle,
    certificate.slug,
  );
  ctx.fillStyle = CERTIFICATE_COLORS.muted;
  ctx.font = `400 ${L.bodyFontSize}px ${sans}`;
  const bodyLines = wrapText(ctx, completionText, L.contentMaxW);
  fillCentered(ctx, bodyLines, L.cx, L.bodyY, L.bodyLineHeight);

  ctx.textAlign = "left";
  const metaLeftX = L.cx - L.metaColGap;
  const metaRightX = L.cx + L.metaColGap * 0.15;
  ctx.fillStyle = `${CERTIFICATE_COLORS.navy}B3`;
  ctx.font = `600 ${L.metaLabelFontSize}px ${sans}`;
  ctx.letterSpacing = "0.12em";
  ctx.fillText(certificatesCopy.dateLabel.toUpperCase(), metaLeftX, L.metaY);
  ctx.fillText(certificatesCopy.idLabel.toUpperCase(), metaRightX, L.metaY);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = CERTIFICATE_COLORS.ink;
  ctx.font = `500 ${L.metaValueFontSize}px ${sans}`;
  ctx.fillText(
    formatCertificateDate(certificate.completedAt),
    metaLeftX,
    L.metaY + L.metaValueFontSize * 1.5,
  );
  ctx.fillText(
    certificate.certificateId,
    metaRightX,
    L.metaY + L.metaValueFontSize * 1.5,
  );

  const qrDrawSize = L.qrSize;
  ctx.drawImage(qrImage, L.qrX, L.qrY, qrDrawSize, qrDrawSize);

  const qrLabelCenterX = L.qrX + qrDrawSize / 2;
  const qrLabelTopY = L.qrY + qrDrawSize + 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = CERTIFICATE_COLORS.muted;
  ctx.font = `500 ${L.qrLabelFontSize}px ${sans}`;
  const qrLabelLines = wrapText(
    ctx,
    certificatesCopy.scanPromptShort,
    L.qrLabelMaxW,
  );
  qrLabelLines.forEach((line, index) => {
    ctx.fillText(
      line,
      qrLabelCenterX,
      qrLabelTopY + index * L.qrLabelFontSize,
    );
  });
  ctx.textBaseline = "middle";

  ctx.textAlign = "center";
  if (signatureImage) {
    const nameY = L.signatureBaseY;
    ctx.fillStyle = CERTIFICATE_COLORS.ink;
    ctx.font = `600 ${L.signatoryNameFontSize}px ${display}`;
    ctx.fillText(certificatesCopy.signatoryName, L.signatureCenterX, nameY);

    const sigW = L.signatureImageW;
    const sigH =
      (signatureImage.naturalHeight / signatureImage.naturalWidth) * sigW;
    const drawH = Math.min(sigH, L.signatureImageH);
    const drawW =
      (signatureImage.naturalWidth / signatureImage.naturalHeight) * drawH;
    const sigBottom = nameY - L.signatoryNameFontSize * 0.55 - L.signatureGapAboveName;
    ctx.drawImage(
      signatureImage,
      L.signatureCenterX - drawW / 2,
      sigBottom - drawH,
      drawW,
      drawH,
    );

    ctx.fillStyle = CERTIFICATE_COLORS.muted;
    ctx.font = `500 ${L.signatoryTitleFontSize}px ${sans}`;
    ctx.fillText(
      certificatesCopy.signatoryTitle,
      L.signatureCenterX,
      nameY + L.signatoryNameFontSize * 1.05,
    );
  } else {
    ctx.strokeStyle = `${CERTIFICATE_COLORS.navy}4D`;
    ctx.beginPath();
    ctx.moveTo(L.signatureCenterX - L.signatureLineW / 2, L.signatureBaseY);
    ctx.lineTo(L.signatureCenterX + L.signatureLineW / 2, L.signatureBaseY);
    ctx.stroke();
    ctx.fillStyle = CERTIFICATE_COLORS.ink;
    ctx.font = `600 ${L.signatoryNameFontSize}px ${display}`;
    ctx.fillText(
      certificatesCopy.signatoryName,
      L.signatureCenterX,
      L.signatureBaseY + L.signatoryNameFontSize * 1.1,
    );
    ctx.fillStyle = CERTIFICATE_COLORS.muted;
    ctx.font = `500 ${L.signatoryTitleFontSize}px ${sans}`;
    ctx.fillText(
      certificatesCopy.signatoryTitle,
      L.signatureCenterX,
      L.signatureBaseY + L.signatoryNameFontSize * 2.2,
    );
  }

  return { canvas, sheetW, sheetH };
}

export function certificatePdfFilename(certificateId: string) {
  return `Bisaya-MedVA-Certificate-${certificateId}.pdf`;
}

export async function buildCertificatePdfBlob(
  certificate: MemberCertificate,
  studentName: string,
) {
  const rendered = await Promise.race([
    renderCertificateCanvas(certificate, studentName),
    new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error("PDF render timed out.")), 20000),
    ),
  ]);
  const { canvas, sheetW, sheetH } = rendered;
  const { jsPDF } = await import("jspdf");
  const image = canvas.toDataURL("image/jpeg", 0.95);
  const widthIn = 11;
  const heightIn = (sheetH / sheetW) * widthIn;
  const pdf = new jsPDF({
    orientation: widthIn >= heightIn ? "landscape" : "portrait",
    unit: "in",
    format: [widthIn, heightIn],
  });
  pdf.addImage(image, "JPEG", 0, 0, widthIn, heightIn);
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

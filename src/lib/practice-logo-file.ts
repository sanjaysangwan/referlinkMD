"use client";

import { isPracticeLogoDataUrl } from "@/lib/practice-logo";

const LOGO_PIXEL_SIZE = 128;

export async function fileToSmallLogo(file: File): Promise<string> {
  if (file.type === "image/svg+xml") {
    if (file.size > 32_000) {
      throw new Error("SVG logos must be under 32 KB.");
    }
    const logo = await readFileAsDataUrl(file);
    if (!isPracticeLogoDataUrl(logo)) {
      throw new Error("That SVG could not be stored as a practice logo.");
    }
    return logo;
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPEG, WebP, GIF, or SVG image.");
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = LOGO_PIXEL_SIZE;
  canvas.height = LOGO_PIXEL_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  const scale = Math.max(LOGO_PIXEL_SIZE / bitmap.width, LOGO_PIXEL_SIZE / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  ctx.drawImage(bitmap, (LOGO_PIXEL_SIZE - width) / 2, (LOGO_PIXEL_SIZE - height) / 2, width, height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that file."));
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

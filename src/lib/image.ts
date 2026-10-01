/**
 * Photo handling for the MVP.
 *
 * GitHub Pages has no filesystem, so a report photo is kept in memory and
 * mirrored into localStorage as a data URL. Raw phone photos are 3–8 MB and
 * would blow the 5 MB storage quota, so every upload is re-encoded to a
 * bounded JPEG first.
 *
 * Swap `readFileAsDataURL` for a signed upload to S3/Supabase later — the
 * DutyReport.photoUrl field is already a plain string.
 */

const MAX_EDGE = 1280;
const QUALITY = 0.72;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not a readable image.'));
    img.src = src;
  });
}

/** Downscale + re-encode so the result is safe to persist. */
export async function compressImage(file: File): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 220 * 1024) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

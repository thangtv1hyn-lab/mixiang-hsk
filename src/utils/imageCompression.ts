/**
 * Client-side image compression utilities for MiXiangg HSK vocabulary flashcards.
 * Converts manual uploads and AI-generated vector illustrations into lightweight
 * compressed WebP/JPEG data URLs (~12–35 KB) to keep storage and payloads fast.
 */

export interface CompressedImageResult {
  dataUrl: string;
  originalKB: number;
  compressedKB: number;
  width: number;
  height: number;
  format: 'webp' | 'jpeg' | 'svg';
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMaxKB?: number;
}

export function estimateDataUrlKB(dataUrl?: string | null): number {
  if (!dataUrl) return 0;
  const base64Index = dataUrl.indexOf(',');
  const raw = base64Index >= 0 ? dataUrl.slice(base64Index + 1) : dataUrl;
  const bytes = dataUrl.includes(';base64,')
    ? Math.floor((raw.length * 3) / 4)
    : new Blob([raw]).size;
  return Math.max(1, Math.round(bytes / 1024));
}

function detectWebpSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function encodeCanvasLightweight(
  canvas: HTMLCanvasElement,
  initialQuality: number,
  targetMaxKB: number
): { dataUrl: string; format: 'webp' | 'jpeg'; compressedKB: number } {
  const supportsWebp = detectWebpSupport();
  const mime = supportsWebp ? 'image/webp' : 'image/jpeg';
  const format: 'webp' | 'jpeg' = supportsWebp ? 'webp' : 'jpeg';

  let quality = initialQuality;
  let dataUrl = canvas.toDataURL(mime, quality);
  let compressedKB = estimateDataUrlKB(dataUrl);

  // Step down quality gently if still heavier than targetMaxKB
  while (compressedKB > targetMaxKB && quality > 0.42) {
    quality = Math.max(0.42, Number((quality - 0.1).toFixed(2)));
    dataUrl = canvas.toDataURL(mime, quality);
    compressedKB = estimateDataUrlKB(dataUrl);
  }

  return { dataUrl, format, compressedKB };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh này.'));
    img.src = src;
  });
}

/**
 * Compresses a manually uploaded image File into a lightweight WebP/JPEG data URL.
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 420,
    maxHeight = 315,
    quality = 0.74,
    targetMaxKB = 40,
  } = options;

  const originalKB = Math.max(1, Math.round(file.size / 1024));

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Không thể đọc dữ liệu tệp ảnh.'));
    };
    reader.onerror = () => reject(new Error('Lỗi đọc tệp ảnh từ thiết bị.'));
    reader.readAsDataURL(file);
  });

  const img = await loadImageElement(rawDataUrl);

  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ nén ảnh Canvas.');
  }

  // Fill warm white background so transparent PNGs compress cleanly without black matte
  ctx.fillStyle = '#FDFBF7';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const encoded = encodeCanvasLightweight(canvas, quality, targetMaxKB);
  return {
    dataUrl: encoded.dataUrl,
    originalKB,
    compressedKB: encoded.compressedKB,
    width,
    height,
    format: encoded.format,
  };
}

/**
 * Rasterizes & compresses an AI-generated SVG illustration into a lightweight WebP/JPEG
 * (typically 10–25 KB) so it renders consistently everywhere and stays ultra-small.
 */
export async function compressSvgToWebp(
  svgMarkup: string,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 400,
    maxHeight = 300,
    quality = 0.78,
    targetMaxKB = 35,
  } = options;

  const trimmedSvg = svgMarkup.trim();
  const originalKB = Math.max(1, Math.round(new Blob([trimmedSvg]).size / 1024));
  const svgBlob = new Blob([trimmedSvg], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImageElement(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, maxWidth, maxHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, maxWidth, maxHeight);

    const encoded = encodeCanvasLightweight(canvas, quality, targetMaxKB);
    return {
      dataUrl: encoded.dataUrl,
      originalKB,
      compressedKB: encoded.compressedKB,
      width: maxWidth,
      height: maxHeight,
      format: encoded.format,
    };
  } catch {
    // Fallback to compact URI-encoded SVG if rasterization fails
    const compactSvg = trimmedSvg.replace(/\s+/g, ' ').replace(/>\s+</g, '><');
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(compactSvg)}`;
    return {
      dataUrl,
      originalKB,
      compressedKB: estimateDataUrlKB(dataUrl),
      width: maxWidth,
      height: maxHeight,
      format: 'svg',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

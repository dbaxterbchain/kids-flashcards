export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

export function slugifySetName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      // Drop accents but keep letters from any language, so non-English set names get distinct ids.
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/(^-|-$)/g, '') || 'custom-set'
  );
}

// Card pictures are shown at most a few hundred pixels wide, so full-size phone photos (often several
// megabytes each) are scaled down before they're saved.
const MAX_PICTURE_SIZE = 1024;

function loadImage(file: File): Promise<{ image: HTMLImageElement; release: () => void }> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  return image
    .decode()
    .then(() => ({ image, release: () => URL.revokeObjectURL(url) }))
    .catch((error) => {
      URL.revokeObjectURL(url);
      throw error;
    });
}

// The average color around the picture's edge, used to fill the card around a picture that doesn't
// match the card's shape so it blends in instead of showing bars.
function edgeColor(context: CanvasRenderingContext2D, width: number, height: number) {
  const strips = [
    context.getImageData(0, 0, width, 1),
    context.getImageData(0, height - 1, width, 1),
    context.getImageData(0, 0, 1, height),
    context.getImageData(width - 1, 0, 1, height),
  ];
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  strips.forEach(({ data }) => {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      red += data[i];
      green += data[i + 1];
      blue += data[i + 2];
      count += 1;
    }
  });
  if (count === 0) return undefined;
  const hex = (value: number) => Math.round(value / count).toString(16).padStart(2, '0');
  return `#${hex(red)}${hex(green)}${hex(blue)}`;
}

function encodeCanvas(canvas: HTMLCanvasElement, sourceType: string) {
  // WebP is smallest and keeps transparency; browsers that can't encode it return PNG instead.
  const webp = canvas.toDataURL('image/webp', 0.85);
  if (webp.startsWith('data:image/webp')) return webp;
  return sourceType === 'image/jpeg' ? canvas.toDataURL('image/jpeg', 0.85) : canvas.toDataURL('image/png');
}

export type PreparedImage = {
  dataUrl: string;
  /** A background color that blends with the picture's edges, when it could be worked out. */
  edgeColor?: string;
};

/** Reads a picture for a card, shrinking it so the saved copy stays small. */
export async function prepareCardImage(file: File): Promise<PreparedImage> {
  // Vector images are already small, and resizing a GIF would stop its animation.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return { dataUrl: await fileToDataUrl(file) };

  let loaded: Awaited<ReturnType<typeof loadImage>>;
  try {
    loaded = await loadImage(file);
  } catch (error) {
    console.warn('Unable to read the picture for resizing; keeping the original', error);
    return { dataUrl: await fileToDataUrl(file) };
  }

  try {
    const { image } = loaded;
    const scale = Math.min(1, MAX_PICTURE_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return { dataUrl: await fileToDataUrl(file) };
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const fill = edgeColor(context, canvas.width, canvas.height);
    const resized = encodeCanvas(canvas, file.type);
    // Base64 is about 4/3 the size of the bytes it holds.
    const dataUrl = (resized.length * 3) / 4 < file.size ? resized : await fileToDataUrl(file);
    return { dataUrl, edgeColor: fill };
  } finally {
    loaded.release();
  }
}

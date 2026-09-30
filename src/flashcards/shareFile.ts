export type SaveResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Hands a JSON file to the share sheet on phones and tablets (Save to Files, AirDrop, email…), or
 * downloads it everywhere else.
 */
export async function shareOrDownloadJson(data: unknown, fileName: string, title: string): Promise<SaveResult> {
  const file = new File([JSON.stringify(data)], fileName, { type: 'application/json' });

  const touchDevice = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (touchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Sharing isn't available right now; fall back to a download.
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}

import { isRunningInNativeApp } from '../hooks/useNativeApp';

// Converts a Blob to a base64 string (needed for Capacitor Filesystem, which
// writes files as base64 rather than accepting raw Blobs directly).
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Saves/exports a file, choosing the correct mechanism for where the app is
// actually running:
//
// - Web browser / installed PWA: the normal <a download> + blob URL trick.
//   This has always worked here since a real browser's download manager
//   catches it and saves it to the device's Downloads folder.
//
// - Inside the native Capacitor app: that same trick silently does nothing,
//   since Capacitor's WebView has no download manager to catch it. Instead,
//   write the file to the app's cache via @capacitor/filesystem, then hand
//   it to @capacitor/share's native share sheet — the person can save it to
//   Files/Drive, or share it directly (WhatsApp, email, etc.).
export const saveOrShareFile = async (blob, filename, mimeType) => {
  if (isRunningInNativeApp()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const base64Data = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      url: written.uri,
      dialogTitle: `Save or share ${filename}`,
    });
    return;
  }

  // Web / PWA path — unchanged from what already worked
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// True only when this code is running inside the actual installed native
// app (the Capacitor-wrapped .apk) — NOT true for a regular mobile browser,
// and NOT true for the installed PWA either. Capacitor injects `window.Capacitor`
// at runtime only inside its own native shell.
export const isRunningInNativeApp = () => {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
};

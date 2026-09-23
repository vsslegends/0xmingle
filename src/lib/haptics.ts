/** Pocket haptics: guarded vibration ticks for key moments. No-op desktop. */
export function buzz(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* haptics are best-effort */
  }
}

export const buzzSend = (): void => buzz(12);
export const buzzMatch = (): void => buzz([25, 50, 25]);
export const buzzAlert = (): void => buzz([40, 40, 40]);

/** Tracks in-flight site-profile photo uploads so that saving/submitting a
 *  profile can wait for them instead of navigating away mid-upload. */

let pending = 0;
const listeners = new Set<(n: number) => void>();

const notify = () => listeners.forEach((l) => l(pending));

export const beginUpload = (count = 1) => {
  pending += count;
  notify();
};

export const endUpload = (count = 1) => {
  pending = Math.max(0, pending - count);
  notify();
};

export const pendingUploads = () => pending;

export const subscribeUploads = (fn: (n: number) => void) => {
  listeners.add(fn);
  fn(pending);
  return () => listeners.delete(fn);
};

/** Resolves once every tracked upload finished (or after `timeoutMs`). */
export const waitForUploads = (timeoutMs = 120000) =>
  new Promise<void>((resolve) => {
    if (pending === 0) return resolve();
    const started = Date.now();
    const timer = setInterval(() => {
      if (pending === 0 || Date.now() - started > timeoutMs) {
        clearInterval(timer);
        resolve();
      }
    }, 200);
  });

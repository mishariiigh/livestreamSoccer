/**
 * Minimal ambient types for the Google AdSense loader.
 *
 * `adsbygoogle.js` is loaded once in the root layout. It exposes a command queue
 * that ad units are pushed onto; the script consumes the queue as units render.
 * Only the members this project actually uses are declared.
 */
declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export {};


// Polyfill for AWS SDK v2 browser compatibility
if (typeof window !== 'undefined' && !window.global) {
  (window as any).global = window;
}

if (typeof global === 'undefined') {
  (window as any).global = window;
}

export {};

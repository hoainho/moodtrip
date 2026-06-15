// Node 22 ships an experimental global `localStorage` that is undefined unless
// `--localstorage-file` is provided; it shadows happy-dom's window.localStorage.
// Re-point the globals at the happy-dom implementations for tests.
if (typeof window !== 'undefined') {
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
}

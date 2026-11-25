// Shared helpers used by every page script.

// Site root: on GitHub Pages the site lives under /Advanced-Composite-Materials.
export const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

// Escape text for safe use inside HTML.
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// True when a value has visible content.
export const filled = v => v != null && String(v).trim() !== "";

// Fetch a JSON file from /data once per page (cached), e.g. fetchJSON("team.json").
const cache = new Map();
export function fetchJSON(file) {
  if (!cache.has(file)) {
    cache.set(file, fetch(`${BASE_PATH}/data/${file}`).then(res => {
      if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
      return res.json();
    }));
  }
  return cache.get(file);
}

// Prefix a site-relative asset path ("./assets/x.png" or "assets/x.png") with BASE_PATH.
// Absolute URLs are returned unchanged.
export function assetUrl(src) {
  if (!src || /^(https?:|data:|\/)/i.test(src)) return src || "";
  return `${BASE_PATH}/${String(src).replace(/^\.\//, "")}`;
}

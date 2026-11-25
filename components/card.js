import { esc } from "../assets/js/utils.js";
import { icon, hasIcon } from "../assets/js/icons.js";

// Lucide icon name (e.g. "flask-conical") → SVG. Anything else is shown as plain text,
// so older data (e.g. an emoji) still renders.
export function cardIcon(name) {
  return hasIcon(name) ? icon(name, { strokeWidth: 1.75 }) : esc(name);
}

export function createCard({ title, description, icon: iconName }) {
  return `
    <div class="card">
      ${iconName ? `<div class="card-icon">${cardIcon(iconName)}</div>` : ""}
      <h3 class="title">${esc(title)}</h3>
      <p class="desc">${esc(description)}</p>
    </div>
  `;
}

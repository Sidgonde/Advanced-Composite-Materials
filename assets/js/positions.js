// Open Positions section on the contact page (data: data/contact.json → "Positions").
const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const filled = v => v != null && String(v).trim() !== "";

// Escape text, then turn URLs and email addresses into clickable links.
function linkify(value) {
  return esc(value).replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:)])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g,
    (match, url, email) => url
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
      : `<a href="mailto:${email}">${email}</a>`
  );
}

const iconSpan = (icon, cls) =>
  filled(icon) ? `<span class="${cls}" aria-hidden="true">${esc(icon)}</span>` : "";

// "areas": compact chips. Each item is a plain string, or { icon, title, text }.
// (text, if given, shows as a tooltip on the chip)
function areasBlock(pos) {
  const chips = (pos.areas || [])
    .map(a => (typeof a === "string" ? { title: a } : a || {}))
    .filter(a => filled(a.title) || filled(a.text))
    .map(a => `
      <li class="pos-chip"${filled(a.text) && filled(a.title) ? ` title="${esc(a.text)}"` : ""}>
        ${iconSpan(a.icon, "pos-chip-icon")}${esc(filled(a.title) ? a.title : a.text)}
      </li>`);
  if (!chips.length) return "";
  return `
    <div class="pos-row">
      <span class="pos-row-label">${esc(pos.areasTitle || "Research Areas")}</span>
      <ul class="pos-chips">${chips.join("")}</ul>
    </div>`;
}

// "details": compact two-column grid. Each row is { icon, label, value }; add as many as needed.
// Older fields (start / deadline / eligibility) are still shown if present.
function detailsBlock(pos) {
  const rows = [
    ...(pos.details || []),
    { icon: "📅", label: "Start", value: pos.start },
    { icon: "⏰", label: "Last Date", value: pos.deadline },
    { icon: "✅", label: "Eligibility", value: pos.eligibility },
  ]
    .filter(d => d && filled(d.value))
    .map(d => `
      <li class="pos-detail">
        ${iconSpan(d.icon, "pos-detail-icon")}
        <div>
          ${filled(d.label) ? `<span class="pos-detail-label">${esc(d.label)}</span>` : ""}
          <span class="pos-detail-value">${linkify(d.value)}</span>
        </div>
      </li>`);
  return rows.length ? `<ul class="pos-details">${rows.join("")}</ul>` : "";
}

function positionCard(pos) {
  const link = pos.link || "";
  const external = /^https?:\/\//i.test(link);
  const button = link ? `
    <a class="position-btn" href="${esc(link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
      ${esc(pos.linkLabel || "Apply / Enquire")} <span aria-hidden="true">→</span>
    </a>` : "";
  const badges = [
    filled(pos.status) ? `<span class="position-status"><span class="pos-dot"></span>${esc(pos.status)}</span>` : "",
  ].join("");

  return `
    <article class="position-card">
      <div class="pos-top">
        <div class="pos-top-text">
          ${badges ? `<div class="position-head">${badges}</div>` : ""}
          <h3 class="position-title">${iconSpan(pos.icon, "pos-title-icon")}<span>${esc(pos.title)}</span></h3>
        </div>
        ${button}
      </div>
      ${filled(pos.description) ? `<p class="position-desc">${linkify(pos.description)}</p>` : ""}
      ${areasBlock(pos)}
      ${detailsBlock(pos)}
    </article>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("positionsContainer");
  if (!container) return;

  fetch(`${BASE_PATH}/data/contact.json`)
    .then(res => res.json())
    .then(data => {
      const positions = data.Positions || [];
      container.innerHTML = positions.length
        ? positions.map(positionCard).join("")
        : `<p class="positions-empty">
             There are no open positions at the moment. Motivated candidates are
             welcome to <a href="#contactForm">get in touch</a> using the form above.
           </p>`;
    })
    .catch(err => console.error("Positions load error:", err));
});

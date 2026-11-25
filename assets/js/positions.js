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

const iconBubble = (icon, cls) =>
  filled(icon) ? `<span class="${cls}" aria-hidden="true">${esc(icon)}</span>` : "";

// "areas": research-area tiles. Each item is a plain string, or { icon, title, text }.
function areasBlock(pos) {
  const tiles = (pos.areas || [])
    .map(a => (typeof a === "string" ? { title: a } : a || {}))
    .filter(a => filled(a.title) || filled(a.text))
    .map(a => `
      <li class="pos-area">
        ${iconBubble(a.icon, "pos-area-icon")}
        <div>
          ${filled(a.title) ? `<h4 class="pos-area-title">${esc(a.title)}</h4>` : ""}
          ${filled(a.text) ? `<p class="pos-area-text">${linkify(a.text)}</p>` : ""}
        </div>
      </li>`);
  if (!tiles.length) return "";
  return `
    <div class="pos-areas-wrap">
      <span class="pos-eyebrow">${esc(pos.areasTitle || "Research Areas")}</span>
      <ul class="pos-areas">${tiles.join("")}</ul>
    </div>`;
}

// "details": Key Details timeline. Each row is { icon, label, value }; add as many as needed.
// Older fields (start / deadline / eligibility) are still shown if present.
function detailsBlock(pos, button) {
  const rows = [
    ...(pos.details || []),
    { icon: "📅", label: "Start", value: pos.start },
    { icon: "⏰", label: "Last Date", value: pos.deadline },
    { icon: "✅", label: "Eligibility", value: pos.eligibility },
  ]
    .filter(d => d && filled(d.value))
    .map(d => `
      <li class="pos-detail">
        <span class="pos-detail-icon" aria-hidden="true">${filled(d.icon) ? esc(d.icon) : "•"}</span>
        <div>
          ${filled(d.label) ? `<span class="pos-detail-label">${esc(d.label)}</span>` : ""}
          <span class="pos-detail-value">${linkify(d.value)}</span>
        </div>
      </li>`);
  if (!rows.length && !button) return "";
  return `
    <aside class="pos-details-panel">
      ${rows.length ? `
        <span class="pos-eyebrow">${esc(pos.detailsTitle || "Key Details")}</span>
        <ul class="pos-details">${rows.join("")}</ul>` : ""}
      ${button}
    </aside>`;
}

function positionCard(pos) {
  const link = pos.link || "";
  const external = /^https?:\/\//i.test(link);
  const button = link ? `
    <a class="position-btn" href="${esc(link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
      ${esc(pos.linkLabel || "Apply / Enquire")} <span aria-hidden="true">→</span>
    </a>` : "";
  const badges = [
    filled(pos.type) ? `<span class="position-type">${esc(pos.type)}</span>` : "",
    filled(pos.status) ? `<span class="position-status"><span class="pos-pulse"></span>${esc(pos.status)}</span>` : "",
  ].join("");

  const areas = areasBlock(pos);
  const details = detailsBlock(pos, button);

  return `
    <article class="position-card">
      <header class="pos-banner">
        ${badges ? `<div class="position-head">${badges}</div>` : ""}
        <h3 class="position-title">${iconBubble(pos.icon, "pos-title-icon")}<span>${esc(pos.title)}</span></h3>
        ${filled(pos.description) ? `<p class="position-desc">${linkify(pos.description)}</p>` : ""}
      </header>
      ${areas || details ? `
        <div class="pos-body${areas && details ? "" : " pos-body--single"}">
          ${areas}
          ${details}
        </div>` : ""}
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

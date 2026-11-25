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

// "areas": bullet points. Each item is a plain string, or { icon, title, text }.
function areasList(areas) {
  const items = (areas || [])
    .map(a => (typeof a === "string" ? { text: a } : a || {}))
    .filter(a => filled(a.title) || filled(a.text))
    .map(a => {
      const icon  = filled(a.icon) ? `<span class="position-icon" aria-hidden="true">${esc(a.icon)}</span>` : "";
      const title = filled(a.title) ? `<strong>${esc(a.title)}</strong>${filled(a.text) ? ": " : ""}` : "";
      return `<li>${icon}<span>${title}${filled(a.text) ? linkify(a.text) : ""}</span></li>`;
    });
  return items.length ? `<ul class="position-areas">${items.join("")}</ul>` : "";
}

// "details": highlighted info box. Each row is { icon, label, value }; add as many as needed.
// Older fields (start / deadline / eligibility) are still shown if present.
function detailsBox(pos) {
  const rows = [
    ...(pos.details || []),
    { icon: "📅", label: "Start", value: pos.start },
    { icon: "⏰", label: "Last Date", value: pos.deadline },
    { icon: "✅", label: "Eligibility", value: pos.eligibility },
  ]
    .filter(d => d && filled(d.value))
    .map(d => `
      <li>
        ${filled(d.icon) ? `<span class="position-icon" aria-hidden="true">${esc(d.icon)}</span>` : ""}
        <span>${filled(d.label) ? `<strong>${esc(d.label)}:</strong> ` : ""}${linkify(d.value)}</span>
      </li>`);
  return rows.length ? `<ul class="position-details">${rows.join("")}</ul>` : "";
}

function positionCard(pos) {
  const link = pos.link || "";
  const external = /^https?:\/\//i.test(link);
  const badges = [
    filled(pos.type) ? `<span class="position-type">${esc(pos.type)}</span>` : "",
    filled(pos.status) ? `<span class="position-status">${esc(pos.status)}</span>` : "",
  ].join("");
  return `
    <article class="position-card">
      ${badges ? `<div class="position-head">${badges}</div>` : ""}
      <h3 class="position-title">
        ${filled(pos.icon) ? `<span class="position-icon" aria-hidden="true">${esc(pos.icon)}</span>` : ""}${esc(pos.title)}
      </h3>
      ${filled(pos.description) ? `<p class="position-desc">${linkify(pos.description)}</p>` : ""}
      ${areasList(pos.areas)}
      ${detailsBox(pos)}
      ${link ? `
        <a class="position-btn" href="${esc(link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
          ${esc(pos.linkLabel || "Apply / Enquire")}
        </a>` : ""}
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

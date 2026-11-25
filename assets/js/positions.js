// Open Positions section on the contact page (data: data/contact.json → "Positions").
const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function detailRow(label, value) {
  if (!value || !String(value).trim()) return "";
  return `
    <p class="position-detail">
      <span class="position-detail-label">${label}</span>
      <span class="position-detail-value">${esc(value)}</span>
    </p>`;
}

function positionCard(pos) {
  const link = pos.link || "";
  const external = /^https?:\/\//i.test(link);
  return `
    <article class="position-card">
      <div class="position-head">
        ${pos.type ? `<span class="position-type">${esc(pos.type)}</span>` : ""}
        ${pos.status ? `<span class="position-status">${esc(pos.status)}</span>` : ""}
      </div>
      <h3 class="position-title">${esc(pos.title)}</h3>
      ${pos.description ? `<p class="position-desc">${esc(pos.description)}</p>` : ""}
      ${detailRow("Eligibility", pos.eligibility)}
      ${detailRow("Start", pos.start)}
      ${detailRow("Last Date", pos.deadline)}
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

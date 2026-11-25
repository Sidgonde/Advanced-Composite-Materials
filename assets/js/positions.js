// Open Positions section on the contact page (data: data/contact.json → "Positions").
//
// Fields per position (all optional except title):
//   status, icon, title, description
//   posted     "YYYY-MM-DD"  → "Posted 25 Nov 2026"
//   lastDate   "YYYY-MM-DD"  → countdown pill ("12 days left"); after this date the
//                              position shows as Closed. Also fills the "last date" detail row.
//   areas      [ { icon, title, text } | "text" ]        → chips (text = hover tooltip)
//   steps      [ "Check eligibility", "Apply", ... ]      → numbered "How to apply" strip
//   details    [ { icon, label, value } ]                 → details grid (as many rows as needed)
//   applyLink / applyLabel                                → primary button (e.g. admissions portal)
//   link / linkLabel                                      → secondary "Enquire" button
//   watermark  emoji shown faintly in the card corner (default 🎓, "" to hide)
const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

const DAY_MS = 24 * 60 * 60 * 1000;

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const filled = v => v != null && String(v).trim() !== "";

// Escape text, then turn URLs and email addresses into clickable links.
// withCopy adds a small "copy" button after each email address.
function linkify(value, withCopy = false) {
  return esc(value).replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:)])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g,
    (_match, url, email) => {
      if (url) return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      const copy = withCopy
        ? `<button type="button" class="pos-copy" data-copy="${email}" aria-label="Copy email address ${email}" title="Copy email">📋</button>`
        : "";
      return `<a href="mailto:${email}">${email}</a>${copy}`;
    }
  );
}

// "YYYY-MM-DD" → local Date (end of that day for deadlines), or null.
function parseDate(value, endOfDay = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

const formatDate = d =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Days until the last date: null (no date), negative (closed), 0 (today), n.
function daysLeft(pos) {
  const end = parseDate(pos.lastDate, true);
  if (!end) return null;
  const now = new Date();
  if (end < now) return -1;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay - today) / DAY_MS);
}

const isClosed = pos => daysLeft(pos) === -1;

const iconSpan = (icon, cls) =>
  filled(icon) ? `<span class="${cls}" aria-hidden="true">${esc(icon)}</span>` : "";

function metaRow(pos) {
  const left = daysLeft(pos);
  const closed = left === -1;
  const parts = [];

  if (closed) {
    parts.push(`<span class="position-status is-closed"><span class="pos-dot"></span>Closed</span>`);
  } else if (filled(pos.status)) {
    parts.push(`<span class="position-status"><span class="pos-dot"></span>${esc(pos.status)}</span>`);
  }

  if (left !== null && !closed) {
    const text = left === 0 ? "Last day today" : `${left} day${left === 1 ? "" : "s"} left`;
    const urgent = left <= 7 ? " is-urgent" : "";
    parts.push(`<span class="pos-countdown${urgent}">⏳ ${text}</span>`);
  }

  const posted = parseDate(pos.posted);
  if (posted) parts.push(`<span class="pos-posted">Posted ${formatDate(posted)}</span>`);

  return parts.length ? `<div class="position-head">${parts.join("")}</div>` : "";
}

// "areas": compact chips. Each item is a plain string, or { icon, title, text }.
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

// "steps": one-line numbered "How to apply" strip.
function stepsBlock(pos) {
  const steps = (pos.steps || []).filter(filled);
  if (!steps.length) return "";
  return `
    <div class="pos-steps-wrap">
      <span class="pos-row-label">${esc(pos.stepsTitle || "How to Apply")}</span>
      <ol class="pos-steps">
        ${steps.map((s, i) => `<li class="pos-step"><span class="pos-step-num">${i + 1}</span>${esc(s)}</li>`).join("")}
      </ol>
    </div>`;
}

// "details": compact two-column grid. Each row is { icon, label, value }.
// Older fields (start / deadline / eligibility) are still shown if present.
function detailsBlock(pos) {
  const rows = [...(pos.details || [])].map(d => ({ ...d }));

  // A valid lastDate fills (or adds) the "last date" row.
  const end = parseDate(pos.lastDate);
  if (end) {
    const row = rows.find(d => /last\s*date|deadline/i.test(d.label || ""));
    if (row) row.value = formatDate(end);
    else rows.unshift({ icon: "⏰", label: "Application last date", value: formatDate(end) });
  }

  rows.push(
    { icon: "📅", label: "Start", value: pos.start },
    { icon: "⏰", label: "Last Date", value: pos.deadline },
    { icon: "✅", label: "Eligibility", value: pos.eligibility },
  );

  const items = rows
    .filter(d => d && filled(d.value))
    .map(d => `
      <li class="pos-detail">
        ${iconSpan(d.icon, "pos-detail-icon")}
        <div>
          ${filled(d.label) ? `<span class="pos-detail-label">${esc(d.label)}</span>` : ""}
          <span class="pos-detail-value">${linkify(d.value, true)}</span>
        </div>
      </li>`);
  return items.length ? `<ul class="pos-details">${items.join("")}</ul>` : "";
}

function buttons(pos) {
  const btn = (href, label, cls) => {
    const external = /^https?:\/\//i.test(href);
    return `
      <a class="position-btn ${cls}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
        ${esc(label)} <span aria-hidden="true">${external ? "↗" : "→"}</span>
      </a>`;
  };
  const hasApply = filled(pos.applyLink) && !isClosed(pos);
  const out = [];
  if (hasApply) out.push(btn(pos.applyLink, pos.applyLabel || "Apply Now", "is-primary"));
  if (filled(pos.link)) out.push(btn(pos.link, pos.linkLabel || "Enquire", hasApply ? "is-outline" : "is-primary"));
  return out.length ? `<div class="pos-actions">${out.join("")}</div>` : "";
}

let cardId = 0;

function positionCard(pos) {
  const id = `pos-more-${++cardId}`;
  const more = stepsBlock(pos) + detailsBlock(pos);
  const watermark = pos.watermark === undefined ? "🎓" : pos.watermark;

  return `
    <div class="reveal">
      <article class="position-card${isClosed(pos) ? " is-closed" : ""}">
        ${iconSpan(watermark, "pos-watermark")}
        <div class="pos-top">
          <div class="pos-top-text">
            ${metaRow(pos)}
            <h3 class="position-title">${iconSpan(pos.icon, "pos-title-icon")}<span>${esc(pos.title)}</span></h3>
          </div>
          ${buttons(pos)}
        </div>
        ${filled(pos.description) ? `<p class="position-desc">${linkify(pos.description)}</p>` : ""}
        ${areasBlock(pos)}
        ${more ? `
          <button type="button" class="pos-toggle" aria-expanded="false" aria-controls="${id}">
            <span class="pos-toggle-text">View details</span> <span class="pos-toggle-arrow" aria-hidden="true">▾</span>
          </button>
          <div class="pos-more" id="${id}">
            <div class="pos-more-inner">${more}</div>
          </div>` : ""}
      </article>
    </div>`;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

function bindInteractions(container) {
  container.addEventListener("click", e => {
    const toggle = e.target.closest(".pos-toggle");
    if (toggle) {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".pos-toggle-text").textContent = open ? "Hide details" : "View details";
      document.getElementById(toggle.getAttribute("aria-controls"))?.classList.toggle("is-open", open);
      return;
    }

    const copyBtn = e.target.closest(".pos-copy");
    if (copyBtn) {
      copyText(copyBtn.dataset.copy)
        .then(() => {
          copyBtn.textContent = "✓ Copied";
          copyBtn.classList.add("is-copied");
        })
        .catch(() => { copyBtn.textContent = "✕"; })
        .finally(() => setTimeout(() => {
          copyBtn.textContent = "📋";
          copyBtn.classList.remove("is-copied");
        }, 1600));
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("positionsContainer");
  if (!container) return;
  bindInteractions(container);

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

      const countEl = document.getElementById("positionsCount");
      const open = positions.filter(p => !isClosed(p)).length;
      if (countEl && open) {
        countEl.textContent = `${open} opening${open === 1 ? "" : "s"}`;
        countEl.hidden = false;
      }
    })
    .catch(err => console.error("Positions load error:", err));
});

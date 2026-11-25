// Open Positions section on the contact page (data: data/contact.json → "Positions").
//
// Fields per position (all optional except title). Icons are chosen automatically.
//   status, title, description
//   posted     "YYYY-MM-DD"  → "Posted 25 Nov 2026"
//   lastDate   "YYYY-MM-DD"  → countdown pill ("12 days left"); after this date the
//                              position shows as Closed. Also fills the "last date" detail row.
//   areas      [ "Micromechanics", "Fracture Mechanics", ... ]   → chips
//   steps      [ "Check eligibility", "Apply", ... ]              → numbered "How to apply" strip
//   details    [ { label, value } ]                               → details grid (as many rows as needed)
//   applyLink / applyLabel                                        → primary button (e.g. admissions portal)
//   link / linkLabel                                              → secondary "Enquire" button
import { esc, filled, fetchJSON } from "./utils.js";
import { icon } from "./icons.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Detail-row icon picked from its label (first match wins).
const DETAIL_ICONS = [
  [/last\s*date|deadline|closing/i, "calendar-clock"],
  [/intake|start|joining|date|session/i, "calendar"],
  [/eligib|qualif|requirement/i, "badge-check"],
  [/select|interview|test|exam|process/i, "clipboard-check"],
  [/contact|email|mail|write/i, "mail"],
  [/phone|call|mobile/i, "phone"],
  [/fellowship|stipend|salary|funding|scholarship/i, "wallet"],
  [/apply|portal|website|link/i, "link"],
  [/location|venue|place/i, "map-pin"],
  [/document|cv|resume|statement/i, "file-text"],
  [/duration|period|time/i, "clock"],
];
const detailIcon = label => (DETAIL_ICONS.find(([re]) => re.test(label || "")) || [, "info"])[1];

// Escape text, then turn URLs and email addresses into clickable links.
// withCopy adds a small "copy" button after each email address.
function linkify(value, withCopy = false) {
  return esc(value).replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:)])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g,
    (_match, url, email) => {
      if (url) return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      const copy = withCopy
        ? `<button type="button" class="pos-copy" data-copy="${email}" aria-label="Copy email address ${email}" title="Copy email">${icon("copy")}</button>`
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

// Days until the last date: null (no date), -1 (closed), 0 (today), n.
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
    parts.push(`<span class="pos-countdown${left <= 7 ? " is-urgent" : ""}">${icon("hourglass")}${text}</span>`);
  }

  const posted = parseDate(pos.posted);
  if (posted) parts.push(`<span class="pos-posted">Posted ${formatDate(posted)}</span>`);

  return parts.length ? `<div class="position-head">${parts.join("")}</div>` : "";
}

// "areas": chips. Plain strings (older { title } objects still work).
function areasBlock(pos) {
  const chips = (pos.areas || [])
    .map(a => (typeof a === "string" ? a : a?.title))
    .filter(filled)
    .map(a => `<li class="pos-chip">${esc(a)}</li>`);
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

// "details": compact two-column grid. Each row is { label, value }.
// Older fields (start / deadline / eligibility) are still shown if present.
function detailsBlock(pos) {
  const rows = (pos.details || []).map(d => ({ ...d }));

  // A valid lastDate fills (or adds) the "last date" row.
  const end = parseDate(pos.lastDate);
  if (end) {
    const row = rows.find(d => /last\s*date|deadline/i.test(d.label || ""));
    if (row) row.value = formatDate(end);
    else rows.unshift({ label: "Application last date", value: formatDate(end) });
  }

  rows.push(
    { label: "Start", value: pos.start },
    { label: "Last Date", value: pos.deadline },
    { label: "Eligibility", value: pos.eligibility },
  );

  const items = rows
    .filter(d => d && filled(d.value))
    .map(d => `
      <li class="pos-detail">
        <span class="pos-detail-icon">${icon(detailIcon(d.label))}</span>
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
        ${esc(label)} ${icon(external ? "arrow-up-right" : "arrow-right")}
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

  return `
    <div class="reveal">
      <article class="position-card${isClosed(pos) ? " is-closed" : ""}">
        <span class="pos-watermark">${icon("graduation-cap", { strokeWidth: 1.25 })}</span>
        <div class="pos-top">
          <div class="pos-top-text">
            ${metaRow(pos)}
            <h3 class="position-title"><span class="pos-title-icon">${icon("briefcase")}</span><span>${esc(pos.title)}</span></h3>
          </div>
          ${buttons(pos)}
        </div>
        ${filled(pos.description) ? `<p class="position-desc">${linkify(pos.description)}</p>` : ""}
        ${areasBlock(pos)}
        ${more ? `
          <button type="button" class="pos-toggle" aria-expanded="false" aria-controls="${id}">
            <span class="pos-toggle-text">View details</span> <span class="pos-toggle-arrow">${icon("chevron-down")}</span>
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
  // Fallback for plain-http / file previews.
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
      const reset = () => {
        copyBtn.innerHTML = icon("copy");
        copyBtn.classList.remove("is-copied");
      };
      copyText(copyBtn.dataset.copy)
        .then(() => {
          copyBtn.innerHTML = `${icon("check")} Copied`;
          copyBtn.classList.add("is-copied");
        })
        .catch(() => { copyBtn.innerHTML = icon("x"); })
        .finally(() => setTimeout(reset, 1600));
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("positionsContainer");
  if (!container) return;
  bindInteractions(container);

  fetchJSON("contact.json")
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

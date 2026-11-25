// Current Research + Past Research pages (same layout, different data).
// The page's <main> says which data to load:
//   <main data-source="current-research.json">                      (no DOI row)
//   <main data-source="past-research.json" data-show-doi="true">    (with DOI row)
// Data format: { "Domain name": [ { title, description, keywords[], doi, image }, ... ], ... }
import { esc, fetchJSON, assetUrl } from "./utils.js";
import { icon } from "./icons.js";

const main = document.querySelector("main[data-source]");
const SOURCE = main?.dataset.source;
const SHOW_DOI = main?.dataset.showDoi === "true";

const slug = text => text.replace(/\s+/g, "-").toLowerCase();

function doiBlock(doi) {
  const value = !doi
    ? `<span class="doi-value is-empty">Not assigned</span>`
    : /^https?:\/\//i.test(doi)
      ? `<a class="doi-value" href="${esc(doi)}" target="_blank" rel="noopener">${esc(doi)}</a>`
      : `<span class="doi-value">${esc(doi)}</span>`;
  return `
    <div class="rcard-doi">
      <div class="doi-icon">${icon("link")}</div>
      <div>
        <span class="doi-label">DOI</span>
        ${value}
      </div>
    </div>`;
}

function buildCard(item, index, panelKey) {
  const descId = `desc-${panelKey}-${index}`;
  const keywords = (item.keywords ?? []).map(k => `<span class="keyword-tag">${esc(k)}</span>`).join("");
  const img = item.image
    ? `<img src="${esc(assetUrl(item.image))}" alt="${esc(item.title)}" loading="lazy">`
    : "";

  return `
    <article class="rcard${index % 2 ? " flip" : ""}">
      <div class="rcard-thumb">
        ${img}
        <div class="thumb-fallback"${item.image ? " hidden" : ""}>${icon("layers", { strokeWidth: 1.4 })}</div>
      </div>

      <div class="rcard-body">
        <span class="rcard-index">Research - ${String(index + 1).padStart(2, "0")}</span>
        <h3 class="rcard-title">${item.title}</h3>

        <div class="rcard-desc-wrap">
          <p class="rcard-desc" id="${descId}">${item.description}</p>
          <button type="button" class="toggle-desc" aria-expanded="false" aria-controls="${descId}" hidden>
            <span class="toggle-label">Show more</span> <span class="arrow">${icon("chevron-down")}</span>
          </button>
        </div>

        ${keywords ? `<div class="rcard-keywords">${keywords}</div>` : ""}
        ${SHOW_DOI ? doiBlock(item.doi) : ""}
      </div>
    </article>`;
}

function renderPanel(domain, items) {
  const key = slug(domain);
  const words = domain.split(" ");
  const last = words.pop();
  const title = words.length ? `${esc(words.join(" "))} <span>${esc(last)}</span>` : `<span>${esc(last)}</span>`;

  return `
    <div class="panel" id="panel-${key}" role="tabpanel" aria-labelledby="tab-${key}">
      <div class="section-header">
        <h2 class="section-title">${title}</h2>
        <span class="research-count">${items.length} Paper${items.length === 1 ? "" : "s"}</span>
      </div>
      <div class="card-list">
        ${items.length
          ? items.map((item, i) => buildCard(item, i, key)).join("")
          : `<div class="empty-state">${icon("circle-alert", { strokeWidth: 1.5 })}<p>No research items available.</p></div>`}
      </div>
    </div>`;
}

// Show "Show more" only where the description is actually cut off.
function updateToggles(scope) {
  scope.querySelectorAll(".rcard-desc").forEach(desc => {
    const btn = desc.parentElement.querySelector(".toggle-desc");
    if (!btn || desc.classList.contains("expanded")) return;
    btn.hidden = desc.scrollHeight <= desc.clientHeight + 2;
  });
}

function activate(key, tabBar, container) {
  tabBar.querySelectorAll(".tab-btn").forEach(btn => {
    const on = btn.dataset.key === key;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", String(on));
  });
  container.querySelectorAll(".panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `panel-${key}`);
  });
  const panel = document.getElementById(`panel-${key}`);
  if (panel) updateToggles(panel);
}

function bindEvents(tabBar, container) {
  tabBar.addEventListener("click", e => {
    const btn = e.target.closest(".tab-btn");
    if (btn) activate(btn.dataset.key, tabBar, container);
  });

  container.addEventListener("click", e => {
    const btn = e.target.closest(".toggle-desc");
    if (!btn) return;
    const desc = document.getElementById(btn.getAttribute("aria-controls"));
    const expanded = desc.classList.toggle("expanded");
    btn.setAttribute("aria-expanded", String(expanded));
    btn.classList.toggle("open", expanded);
    btn.querySelector(".toggle-label").textContent = expanded ? "Show less" : "Show more";
  });

  // Missing image → show the placeholder instead of a broken image.
  container.addEventListener("error", e => {
    if (e.target.tagName !== "IMG") return;
    e.target.hidden = true;
    e.target.nextElementSibling?.removeAttribute("hidden");
  }, true);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const active = container.querySelector(".panel.active");
      if (active) updateToggles(active);
    }, 150);
  });
}

async function init() {
  const tabBar = document.getElementById("tab-bar");
  const container = document.getElementById("panels-container");
  if (!SOURCE || !tabBar || !container) return;

  container.innerHTML = '<div class="loading-state">Loading research…</div>';
  bindEvents(tabBar, container);

  try {
    const data = await fetchJSON(SOURCE);
    const domains = Object.keys(data);
    if (!domains.length) throw new Error("No research areas found.");

    tabBar.innerHTML = domains.map(domain => `
      <button type="button" class="tab-btn" id="tab-${slug(domain)}" data-key="${slug(domain)}"
        role="tab" aria-selected="false" aria-controls="panel-${slug(domain)}">
        ${esc(domain)} <span class="tab-dot"></span>
      </button>`).join("");
    container.innerHTML = domains.map(domain => renderPanel(domain, data[domain])).join("");

    activate(slug(domains[0]), tabBar, container);
  } catch (err) {
    console.error(`Failed to load ${SOURCE}:`, err);
    container.innerHTML = `
      <div class="error-state">
        ${icon("circle-alert")} Could not load research data. Please try again later.
      </div>`;
  }
}

init();

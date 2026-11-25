 // Funded Projects page: ongoing / completed tabs of project cards.
import { fetchJSON } from "./utils.js";
import { icon } from "./icons.js";

const icons = {
  calendar: icon("calendar"),
  coin: icon("coins"),
  building: icon("building-2"),
  cardIcon: icon("layers", { strokeWidth: 1.8 }),
  person: icon("user"),
  tag: icon("tag"),
  empty: icon("circle-alert", { strokeWidth: 1.5 }),
};

function parseRole(raw, fallbackVariant, fallbackLabel) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const i = trimmed.indexOf(':');
  const label = i > -1 ? trimmed.slice(0, i).trim() : null;
  const value = i > -1 ? trimmed.slice(i + 1).trim() : trimmed;

  const probe = `${label || ''} ${value}`.toLowerCase();
  let variant = fallbackVariant;
  if (/co-?pi|co-?principal/.test(probe)) variant = 'copi';
  else if (/\bpi\b|principal investigator/.test(probe)) variant = 'pi';

  const bareKeyword = !label && /^(pi|co-pi|role)$/i.test(value);

  return { label: bareKeyword ? null : (label || fallbackLabel), value, variant };
}

function roleMetaRow(entry) {
  if (!entry?.value) return '';
  return `
    <div class="meta-row">
      <div class="meta-icon role-icon-${entry.variant}">${icons.person}</div>
      <div class="meta-text">
        <span class="meta-label">${entry.label || 'Investigator'}</span>
        <span class="meta-value">${entry.value}</span>
      </div>
    </div>`;
}

function projectTypeRow(rawType) {
  if (!rawType || !rawType.trim()) return '';
  const isConsultancy = /consult/i.test(rawType);
  const label = isConsultancy ? 'Consultancy' : rawType.trim().replace(/^\w/, c => c.toUpperCase());
  return `
    <div class="meta-row">
      <div class="meta-icon">${icons.tag}</div>
      <div class="meta-text">
        <span class="meta-label">Project Type</span>
        <span class="meta-value">${label}</span>
      </div>
    </div>`;
}

function buildCard(project, type) {
  const badgeClass = type === 'ongoing' ? 'badge-ongoing' : 'badge-completed';
  const badgeLabel = type === 'ongoing' ? 'Ongoing'       : 'Completed';

  const pi   = parseRole(project.pi,   'pi',   'Principal Investigator');
  const coPi = parseRole(project.coPi, 'copi', 'Co-Principal Investigator');
  const role = parseRole(project.role, 'other','Project Role');
  const roleRowsHTML = [roleMetaRow(pi), roleMetaRow(coPi), roleMetaRow(role)]
    .filter(Boolean)
    .join('');

  return `
    <article class="card">
      <span class="card-badge ${badgeClass}">${badgeLabel}</span>

      <div class="card-icon">${icons.cardIcon}</div>

      <h3 class="card-title">${project.title}</h3>

      ${project.description ? `<p class="card-desc">${project.description}</p>` : ''}

      <div class="card-meta">

        ${projectTypeRow(project.type)}

        <div class="meta-row">
          <div class="meta-icon">${icons.calendar}</div>
          <div class="meta-text">
            <span class="meta-label">Duration</span>
            <span class="meta-value">${project.duration}</span>
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-icon">${icons.coin}</div>
          <div class="meta-text">
            <span class="meta-label">Funding</span>
            <span class="meta-value">${project.funding}</span>
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-icon">${icons.building}</div>
          <div class="meta-text">
            <span class="meta-label">Sponsoring Agency</span>
            <span class="meta-value">${project.agency}</span>
          </div>
        </div>

        ${roleRowsHTML}

      </div>
    </article>`;
}

function renderGrid(type, data) {
  const grid  = document.getElementById(`grid-${type}`);
  const count = document.getElementById(`count-${type}`);
  const projects = data[type] ?? [];

  count.textContent = `${projects.length} Project${projects.length !== 1 ? 's' : ''}`;

  if (!projects.length) {
    grid.innerHTML = `
      <div class="empty-state">
        ${icons.empty}
        <p>No projects available.</p>
      </div>`;
    return;
  }

  grid.innerHTML = projects.map(p => buildCard(p, type)).join('');
}

function switchTab(tab) {
  ['ongoing', 'completed'].forEach(t => {
    const btn   = document.getElementById(`tab-${t}`);
    const panel = document.getElementById(`panel-${t}`);
    const isActive = t === tab;

    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
    panel.classList.toggle('active', isActive);
  });
}

document.querySelector(".tab-bar")?.addEventListener("click", e => {
  const btn = e.target.closest(".tab-btn[data-tab]");
  if (btn) switchTab(btn.dataset.tab);
});

async function init() {
  const grids = ['ongoing', 'completed'];

  grids.forEach(type => {
    const grid = document.getElementById(`grid-${type}`);
    if (grid) grid.innerHTML = '<div class="loading-state">Loading projects…</div>';
  });

  try {
    const data = await fetchJSON("sponsored-projects.json");

    grids.forEach(type => renderGrid(type, data));
  } catch (err) {
    console.error('Failed to load project data:', err);

    grids.forEach(type => {
      const grid = document.getElementById(`grid-${type}`);
      if (grid) {
        grid.innerHTML = `
          <div class="error-state">
            ${icon("circle-alert")} Could not load projects. Please try again later.
          </div>`;
      }
    });
  }
}

init();

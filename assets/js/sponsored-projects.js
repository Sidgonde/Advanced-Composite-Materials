 const BASE_PATH = window.location.hostname.includes("github.io")
    ? "/Advanced-Composite-Materials"
    : ".";

const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>`,

  coin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M14.5 9a3 3 0 0 0-5 2c0 2 3 3 3 3"/>
    <line x1="12" y1="17" x2="12" y2="17.5" stroke-width="2.5"/>
  </svg>`,

  building: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
  </svg>`,

  cardIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="#58e3e1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>`,

  person: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>
  </svg>`,

  tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.59 13.41l-7.18 7.18a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>`,

  empty: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8"  x2="12"   y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`
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

window.switchTab = switchTab;

async function init() {
  const grids = ['ongoing', 'completed'];

  grids.forEach(type => {
    const grid = document.getElementById(`grid-${type}`);
    if (grid) grid.innerHTML = '<div class="loading-state">Loading projects…</div>';
  });

  try {
    const response = await fetch(`${BASE_PATH}/data/sponsored-projects.json`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    grids.forEach(type => renderGrid(type, data));
  } catch (err) {
    console.error('Failed to load project data:', err);

    grids.forEach(type => {
      const grid = document.getElementById(`grid-${type}`);
      if (grid) {
        grid.innerHTML = `
          <div class="error-state">
            ⚠️ Could not load projects. Please try again later.<br>
            <small style="opacity:.6">${err.message}</small>
          </div>`;
      }
    });
  }
}

init();

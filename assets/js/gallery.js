// Gallery page: category filter, masonry grid, image viewer (modal with prev/next).
import { esc, fetchJSON, assetUrl } from "./utils.js";
import { icon } from "./icons.js";

const svgClock = icon("clock");
const svgImgPlaceholder = icon("image", { strokeWidth: 1.4 });
const svgZoom = icon("zoom-in", { strokeWidth: 2.2 });

let allItems       = [];
let filteredItems  = [];
let currentIndex   = 0;   // position inside filteredItems (the viewer follows the active filter)

function buildCard(item, position) {
  const div = document.createElement('div');
  div.className = 'gallery-item';
  div.tabIndex = 0;
  div.setAttribute('role', 'button');
  div.setAttribute('aria-label', `View ${item.title}`);

  const imgOrPlaceholder = item.image
    ? `<img src="${esc(assetUrl(item.image))}" alt="${esc(item.title)}" loading="lazy">`
    : '';

  div.innerHTML = `
    ${imgOrPlaceholder}
    <div class="img-placeholder"${item.image ? ' hidden' : ''}>
      ${svgImgPlaceholder}
    </div>
    <div class="gallery-item-overlay">
      <div class="overlay-category">${esc(item.category)}</div>
      <div class="overlay-title">${esc(item.title)}</div>
      <div class="overlay-timeline">
        ${svgClock}
        ${esc(item.timeline)}
      </div>
    </div>
    <div class="gallery-item-zoom">${svgZoom}</div>`;

  // Missing image → placeholder instead of a broken image icon.
  div.querySelector('img')?.addEventListener('error', e => {
    e.target.hidden = true;
    div.querySelector('.img-placeholder').hidden = false;
  });

  div.addEventListener('click', () => openModal(position));
  div.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(position); }
  });
  return div;
}

function renderGrid(items) {
  const grid  = document.getElementById('masonryGrid');
  const stats = document.getElementById('galleryStats');

  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = '<div class="empty-state">No items found for this category.</div>';
    stats.innerHTML = '';
    return;
  }

  stats.innerHTML = `Showing <span>${items.length}</span> of <span>${allItems.length}</span> items`;

  items.forEach((item, i) => grid.appendChild(buildCard(item, i)));
}

function buildFilters(categories) {
  const bar = document.getElementById('filterBar');
  bar.innerHTML = '';

  const all = document.createElement('button');
  all.type        = 'button';
  all.className   = 'filter-btn active';
  all.textContent = 'All';
  all.addEventListener('click', () => applyFilter('All', all));
  bar.appendChild(all);

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className   = 'filter-btn';
    btn.type        = 'button';
    btn.textContent = cat;
    btn.addEventListener('click', () => applyFilter(cat, btn));
    bar.appendChild(btn);
  });
}

function applyFilter(category, clickedBtn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  clickedBtn.classList.add('active');

  filteredItems = category === 'All'
    ? [...allItems]
    : allItems.filter(item => item.category === category);

  renderGrid(filteredItems);
}

const overlay    = document.getElementById('modalOverlay');
const modalImg   = document.getElementById('modalImg');
const modalImgPane  = document.querySelector('.modal-img-pane');
const modalFallback = document.getElementById('modalFallback');
const modalTitle    = document.getElementById('modalTitle');
const modalDesc     = document.getElementById('modalDesc');
const modalVenue    = document.getElementById('modalVenue');
const modalTimeline = document.getElementById('modalTimeline');
const modalCounter  = document.getElementById('modalCounter');
const modalCategory = document.getElementById('modalCategory');

function openModal(position) {
  currentIndex = position;
  populateModal(filteredItems[position]);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function populateModal(item) {
  if (item.image) {
    modalImgPane.style.aspectRatio = '4 / 3';
    modalImg.onload = () => {
      modalImgPane.style.aspectRatio = `${modalImg.naturalWidth} / ${modalImg.naturalHeight}`;
    };
    modalImg.onerror = () => {
      modalImg.style.display = 'none';
      modalFallback.style.display = 'flex';
      modalImgPane.style.aspectRatio = '4 / 3';
    };
    modalImg.alt = item.title;
    modalImg.style.display = 'block';
    modalFallback.style.display = 'none';
    modalImg.src = assetUrl(item.image);
    if (modalImg.complete && modalImg.naturalWidth) {
      modalImgPane.style.aspectRatio = `${modalImg.naturalWidth} / ${modalImg.naturalHeight}`;
    }
  } else {
    modalImg.style.display = 'none';
    modalFallback.style.display = 'flex';
    modalImgPane.style.aspectRatio = '4 / 3';
  }

  modalCategory.textContent  = item.category;
  modalTitle.textContent     = item.title;
  modalDesc.textContent      = item.description;
  modalVenue.textContent     = item.venue;
  modalTimeline.textContent  = item.timeline;
  modalCounter.textContent   = `${currentIndex + 1} / ${filteredItems.length}`;

  document.getElementById('modalPrev').style.display = currentIndex > 0 ? 'flex' : 'none';
  document.getElementById('modalNext').style.display = currentIndex < filteredItems.length - 1 ? 'flex' : 'none';
}

function navigateModal(direction) {
  const next = currentIndex + direction;
  if (next < 0 || next >= filteredItems.length) return;
  currentIndex = next;
  populateModal(filteredItems[currentIndex]);
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalPrev').addEventListener('click', () => navigateModal(-1));
document.getElementById('modalNext').addEventListener('click', () => navigateModal(1));

overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (!overlay.classList.contains('open')) return;
  if (e.key === 'Escape')     closeModal();
  if (e.key === 'ArrowLeft')  navigateModal(-1);
  if (e.key === 'ArrowRight') navigateModal(1);
});

async function init() {
  const grid = document.getElementById('masonryGrid');
  grid.innerHTML = '<div class="loading-state">Loading gallery…</div>';

  try {
    const data = await fetchJSON('gallery.json');
    allItems = data;

    const categories = [...new Set(data.map(item => item.category))];

    filteredItems = [...allItems];
    buildFilters(categories);
    renderGrid(filteredItems);
  } catch (err) {
    console.error('Gallery load error:', err);
    grid.innerHTML = `
      <div class="error-state">
        ${icon('circle-alert')} Could not load gallery. Please try again later.
      </div>`;
  }
}

init();

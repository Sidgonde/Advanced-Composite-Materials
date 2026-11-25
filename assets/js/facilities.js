const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

const CATEGORY_CLASS_MAP = {
  "Characterization": "cat-characterization",
  "Fabrication":      "cat-fabrication",
  "Mechanical":       "cat-mechanical",
  "Thermal":          "cat-thermal",
  "Computational":    "cat-computational",
  "Imaging":          "cat-imaging",
  "Other":            "cat-other",
};

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${BASE_PATH}/data/facilities.json`)
    .then((res) => res.json())
    .then((data) => {
      renderRibbon(data.ribbon);
      renderStats(data.stats);
      renderFilters(data.equipment);
      renderEquipment(data.equipment, data.defaultContact);
      renderBookingNote(data.bookingNote);
      renderInfoCards(data.info);
    })
    .catch((err) => console.error("Facilities load error:", err));
});

function renderRibbon({ title, description }) {
  document.getElementById("ribbonTitle").innerHTML = title;
  document.getElementById("ribbonDesc").innerHTML  = description;
}

// One-line "contact for this facility" note. If a card fills any of its own `contact`
// fields, that contact is used as-is; otherwise `defaultContact` is used.
// Empty fields are skipped, and nothing renders if all are empty.
function contactLine(itemContact = {}, defaultContact = {}) {
  const hasOwn = ["name", "email", "phone", "link"].some(k => (itemContact[k] || "").trim());
  const source = hasOwn ? itemContact : defaultContact;
  const pick = key => (source[key] || "").trim();
  const name  = pick("name");
  const email = pick("email");
  const phone = pick("phone");
  const link  = pick("link");
  if (!name && !email && !phone && !link) return "";

  const parts = [];
  if (email) parts.push(`<a href="mailto:${email}">${email}</a>`);
  if (phone) parts.push(`<a href="tel:${phone.replace(/\s+/g, "")}">${phone}</a>`);
  if (link) {
    const external = /^https?:\/\//i.test(link);
    const label = pick("linkLabel") || "Booking link";
    parts.push(`<a href="${link}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`);
  }

  let text = "To use this facility, contact";
  if (name) text += ` <strong>${name}</strong>`;
  if (name && parts.length) text += ":";
  if (parts.length) text += ` ${parts.join(" · ")}`;

  return `
    <p class="fac-contact">
      <i class="bi bi-person-lines-fill"></i>
      <span>${text}</span>
    </p>`;
}

function renderBookingNote(note) {
  const el = document.getElementById("facBookingNote");
  if (!el) return;
  if (note && note.trim()) {
    el.innerHTML = note;
    el.hidden = false;
  }
}

function renderStats(stats) {
  const grid = document.getElementById("facStatsGrid");
  grid.innerHTML = stats.map(s => `
    <div class="fac-stat-item">
      <div class="fac-stat-value">${s.value}</div>
      <div class="fac-stat-label">${s.label}</div>
    </div>
  `).join("");
}

function renderFilters(equipment) {
  const categories = ["All", ...new Set(equipment.map(e => e.category))];
  const filterBar  = document.getElementById("facFilter");

  filterBar.innerHTML = categories.map((cat, i) => `
    <button class="fac-tab ${i === 0 ? "active" : "."}" data-filter="${cat}">
      ${cat}
    </button>
  `).join("");

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".fac-tab");
    if (!btn) return;

    filterBar.querySelectorAll(".fac-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    applyFilter(btn.dataset.filter);
  });
}

function applyFilter(selected) {
  const cards  = document.querySelectorAll(".fac-card");
  const empty  = document.getElementById("facEmpty");
  let visible  = 0;

  cards.forEach(card => {
    const match = selected === "All" || card.dataset.category === selected;
    card.classList.toggle("hidden", !match);
    if (match) visible++;
  });

  empty.classList.toggle("hidden", visible > 0);
}

function renderEquipment(equipment, defaultContact) {
  const grid = document.getElementById("facGrid");

  grid.innerHTML = equipment.map(item => {
    const catClass  = CATEGORY_CLASS_MAP[item.category] || "cat-other";
    const statusClass = `status-${item.status.toLowerCase().replace(/\s+/g, "-")}`;
    const imageHTML = item.image
      ? `<img src="${item.image}" alt="${item.name}" class="fac-card-img" loading="lazy">`
      : `<div class="fac-card-placeholder"><i class="bi bi-${item.icon || "cpu"}"></i></div>`;

    const specsHTML = item.specs.map(spec =>
      `<li><i class="bi bi-check2"></i>${spec}</li>`
    ).join("");

    return `
      <div class="fac-card" data-category="${item.category}">
        ${imageHTML}
        <div class="fac-card-body">
          <span class="fac-card-category ${catClass}">${item.category}</span>
          <div class="fac-card-title">${item.name}</div>
          ${item.model ? `<div class="fac-card-model">${item.model}</div>` : ""}
          <p class="fac-card-desc">${item.description}</p>
          <ul class="fac-specs">${specsHTML}</ul>
          <div class="fac-status-label">${item.availabilityLabel || "Facility Availability"}</div>
          <div class="fac-status ${statusClass}">
            <span class="fac-status-dot"></span>
            ${item.status}
          </div>
          ${contactLine(item.contact, defaultContact)}
        </div>
      </div>
    `;
  }).join("");
}

function renderInfoCards(info) {
  const grid = document.getElementById("facInfoGrid");

  grid.innerHTML = info.map(card => {
    const itemsHTML = card.items.map(item =>
      `<li><i class="bi bi-chevron-right"></i>${item}</li>`
    ).join("");

    return `
      <div class="fac-info-card">
        <div class="fac-info-icon"><i class="bi bi-${card.icon}"></i></div>
        <div class="fac-info-title">${card.title}</div>
        <ul class="fac-info-list">${itemsHTML}</ul>
      </div>
    `;
  }).join("");
}

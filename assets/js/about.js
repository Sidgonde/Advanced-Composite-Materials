// About page: mission/vision, feature cards, PI card, stats, education, experience,
// journals table, memberships, awards (data/about.json).
import { esc, fetchJSON, assetUrl } from "./utils.js";
import { createCard } from "../../components/card.js";

function institutionLogo(item, altName) {
  return item.logo
    ? `<img src="${esc(assetUrl(item.logo))}" alt="${esc(altName)}" loading="lazy">`
    : (item.logoInitials || altName.charAt(0));
}

const els = {
  title:       document.getElementById("aboutTitle"),
  subtitle:    document.getElementById("aboutSubtitle"),
  mission:     document.getElementById("missionText"),
  vision:      document.getElementById("visionText"),
  services:    document.getElementById("servicesContainer"),
  founder:     document.getElementById("founderGrid"),
  stats:       document.getElementById("statsGrid"),
  education:   document.getElementById("educationList"),
  experience:  document.getElementById("experienceTimeline"),
  journals:    document.getElementById("journalsTable"),
  memberships: document.getElementById("membershipList"),
  awards:      document.getElementById("awardsGrid")
};

fetchJSON("about.json")
  .then(data => {
    els.title.innerHTML    = data.title;
    els.subtitle.innerHTML = data.subtitle;
    els.mission.textContent  = data.mission;
    els.vision.textContent   = data.vision;

    els.services.innerHTML = data.features
      .map(service => createCard(service))
      .join("");

    els.founder.innerHTML = data.founder
      .map(t => `
        <div class="col-md-4 founderinnerGrid">
          <div class="founder-card text-center">
            ${t.image
              ? `<img class="founder-avatar founder-avatar-photo" src="${esc(assetUrl(t.image))}" alt="${esc(t.name)}" loading="lazy">`
              : `<div class="founder-avatar">${t.initial}</div>`}
            <h5 class="mt-3 founder-name">${t.name}</h5>
            <p class="text-dark founder-role">${t.role}</p>
            <p class="text-muted founder-bio">${t.bio}</p>
            ${t.cv
              ? `<a class="d-block founder-btn" href="${esc(assetUrl(t.cv))}" target="_blank" rel="noopener">View CV</a>`
              : `<button class="d-block founder-btn" disabled>View CV</button>`}
            <a class="d-block founder-btn founder-btn1 highlight" href="${t.connect || "./contact.html"}"${/^https?:/.test(t.connect || "") ? ' target="_blank" rel="noopener"' : ""}>Get Connect</a>
          </div>
        </div>`)
      .join("");

    els.stats.innerHTML = `
      <div class="row g-4">
        ${data.stats.map(s => `
          <div class="col-6 col-md-3">
            <div class="stats-item">
              ${s.value}<span>${s.label}</span>
            </div>
          </div>`).join("")}
      </div>`;

    els.education.innerHTML = data.education
      .map(e => `
        <div class="col-md-6">
          <div class="feature-card edu-card">
            <div class="institution-logo edu-logo">${institutionLogo(e, e.institution)}</div>
            <h5 style="font-weight: 1000;">${e.degree}</h5>
            <p class="text-muted">${e.institution}</p>
            <small class="edu-details">${e.details}</small>
            ${e.advisor ? `<small class="edu-advisor">${e.advisor}</small>` : ""}
          </div>
        </div>`)
      .join("");

    els.experience.innerHTML = data.experience
      .map(x => `
        <div class="mb-4 ps-4 border-3 border-start border-info">
          <div class="experience-row">
            <div class="institution-logo">${institutionLogo(x, x.org)}</div>
            <div class="experience-content">
              <h5 style="font-weight: 1000;">${x.role} – ${x.org}</h5>
              <small class="text-muted">${x.period}</small>
              <p>${x.desc}</p>
            </div>
          </div>
        </div>`)
      .join("");

    const JOURNALS_VISIBLE = 6;
    els.journals.innerHTML = data.journals
      .map((j, i) => `
        <tr${i >= JOURNALS_VISIBLE ? ' class="journal-extra" hidden' : ""}>
          <td>${j.title}</td>
          <td>${j.count}</td>
        </tr>`)
      .join("");

    const extraCount = data.journals.length - JOURNALS_VISIBLE;
    if (extraCount > 0) {
      const moreBar = document.createElement("div");
      moreBar.className = "journals-more";
      moreBar.innerHTML = `
        <button type="button" class="founder-btn journals-toggle" aria-expanded="false">
          Show all ${data.journals.length} journals
        </button>
        <a class="journals-all-link" href="./journals.html">View full publication list →</a>`;
      els.journals.closest(".table-responsive").after(moreBar);

      const toggle = moreBar.querySelector(".journals-toggle");
      toggle.addEventListener("click", () => {
        const expand = toggle.getAttribute("aria-expanded") !== "true";
        els.journals.querySelectorAll(".journal-extra").forEach(r => { r.hidden = !expand; });
        toggle.setAttribute("aria-expanded", String(expand));
        toggle.textContent = expand ? "Show fewer" : `Show all ${data.journals.length} journals`;
      });
    }

    els.memberships.innerHTML = data.memberships
      .map(m => `<li class="list-group-item">${m}</li>`)
      .join("");

    els.awards.innerHTML = data.awards
      .map(a => `
        <div class="col-sm-6 col-md-4">
          <div class="feature-card text-center">
            <h5 style="font-weight: 1000;">${a.title}</h5>
            <p class="text-muted">${a.year}</p>
          </div>
        </div>`)
      .join("");

    const founder = data.founder && data.founder[0];
    if (founder) {
      const ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": founder.name,
        "jobTitle": founder.role,
        "description": founder.bio,
        "worksFor": {
          "@type": "Organization",
          "name": "Advanced Composite Materials Lab"
        },
        "affiliation": data.experience && data.experience[0] ? data.experience[0].org : undefined
      });
      document.head.appendChild(ld);
    }
  })
  .catch(err => console.error("About page load failed:", err));

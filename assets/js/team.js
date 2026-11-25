const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

const TABS = [
  { label: "All",          key: "all" },
  { label: "Post Doc",     key: "postdoc" },
  { label: "PhD",          key: "phd" },
  { label: "MTech / MS",   key: "mtech", match: ["mtech", "ms"] },
  { label: "UG / Dual",    key: "ug" },
  { label: "Student",      key: "student" },
  { label: "Project Staff",key: "project_staff" },
  { label: "Alumni",       key: "alumni" },
];

const PHOTO_CATEGORIES = ["postdoc", "phd", "ms", "mtech"];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function detailRow(label, value) {
  if (!value || !String(value).trim()) return "";
  return `
    <p class="team-detail">
      <span class="team-detail-label">${label}</span>
      <span class="team-detail-value">${esc(value)}</span>
    </p>`;
}

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${BASE_PATH}/data/team.json`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("ribbonTitle").innerHTML = data.ribbon.title;
      document.getElementById("ribbonDesc").innerHTML  = data.ribbon.description;

      const container = document.getElementById("teamContainer");

      const filterBar = document.createElement("div");
      filterBar.classList.add("team-filter");
      filterBar.setAttribute("role", "tablist");
      filterBar.setAttribute("aria-label", "Filter team by category");

      TABS.forEach(tab => {
        const btn = document.createElement("button");
        btn.classList.add("filter-btn");
        btn.dataset.filter = tab.key;
        btn.textContent = tab.label;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", tab.key === "all" ? "true" : "false");
        if (tab.key === "all") btn.classList.add("active");
        filterBar.appendChild(btn);
      });

      container.insertAdjacentElement("beforebegin", filterBar);

      function compactSocialLinks(member) {
        const s = member.socials || {};
        return `
          <a href="${s.email || "#"}" aria-label="Email"><i class="bi bi-envelope"></i></a>
          <a href="${s.g_scholar || "#"}" target="_blank" rel="noopener" aria-label="Google Scholar">
            <svg class="gscholar-icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg">
              <title>Google Scholar icon</title>
              <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
            </svg>
          </a>
          <a href="${s.linkedin || "#"}" target="_blank" rel="noopener" aria-label="Profile"><i class="bi bi-linkedin"></i></a>
        `;
      }

      function fullSocialLinks(member) {
        const s = member.socials || {};
        return `
          <a href="${s.researchGate || "#"}" target="_blank" rel="noopener" aria-label="ResearchGate">
          <span class="researchgate-icon" aria-hidden="true"></span></a>
          <a href="${s.email || "#"}" aria-label="Email"><i class="bi bi-envelope"></i></a>
          <a href="${s.linkedin || "#"}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
          <a href="#" aria-label="GitHub"><i class="bi bi-github"></i></a>
        `;
      }

      // Guide / Co-Guide: each line renders only when its field is filled in team.json.
      function guideRows(member) {
        const rows = [["Guide", member.guide], ["Co-Guide", member.coGuide]]
          .filter(([, name]) => name && String(name).trim())
          .map(([label, name]) => `
            <p class="team-guide-row">
              <span class="team-guide-label">${label}</span>
              <span class="team-guide-name">${esc(name)}</span>
            </p>`)
          .join("");
        return rows ? `<div class="team-guides">${rows}</div>` : "";
      }

      function alumniCardBody(member) {
        const graduated = [member.degree, member.gradYear && `Graduated ${member.gradYear}`]
          .filter(Boolean).join(" · ");
        return `
          <h3 class="team-name">${esc(member.name)}</h3>
          ${graduated ? `<p class="team-role">${esc(graduated)}</p>` : ""}
          ${detailRow("Thesis", member.thesis)}
          ${detailRow("Current Role", member.currentRole)}
          ${guideRows(member)}
        `;
      }

      function standardCardBody(member) {
        return `
          <h3 class="team-name">${esc(member.name)}</h3>
          <p class="team-role">${esc(member.role)}</p>
          ${detailRow("Graduation Year", member.gradYear)}
          ${detailRow("Thesis", member.thesis)}
          ${member.description ? `
            <p class="team-desc">${esc(member.description)}</p>
            <button type="button" class="team-desc-toggle" hidden>Read more</button>` : ""}
          <div class="team-card-footer">
            ${guideRows(member)}
            <div class="social-links">
              ${member.category === "student" ? compactSocialLinks(member) : fullSocialLinks(member)}
            </div>
          </div>
        `;
      }

      const hasPhoto = m => PHOTO_CATEGORIES.includes(m.category || "other") && m.image;
      const members = [...data.Team.filter(hasPhoto), ...data.Team.filter(m => !hasPhoto(m))];

      const firstTextOnly = members.find(m => !hasPhoto(m));

      members.forEach(member => {
        if (member === firstTextOnly && members.some(hasPhoto)) {
          const rowBreak = document.createElement("div");
          rowBreak.className = "team-row-break";
          rowBreak.setAttribute("aria-hidden", "true");
          container.appendChild(rowBreak);
        }

        const category  = member.category || "other";
        const showPhoto = hasPhoto(member);

        const card = document.createElement("div");
        card.classList.add("team-card");
        if (!showPhoto) card.classList.add("team-card--no-photo");
        if (category === "alumni") card.classList.add("team-card--alumni");
        card.dataset.category = category;

        card.innerHTML = `
          ${showPhoto ? `<img src="${esc(member.image)}" alt="${esc(member.name)}" class="team-img" loading="lazy">` : ""}
          <div class="team-content">
            ${category === "alumni" ? alumniCardBody(member) : standardCardBody(member)}
          </div>
        `;
        container.appendChild(card);
      });

      container.addEventListener("click", e => {
        const btn = e.target.closest(".team-desc-toggle");
        if (!btn) return;
        const desc = btn.previousElementSibling;
        const expanded = desc.classList.toggle("expanded");
        btn.textContent = expanded ? "Show less" : "Read more";
      });

      function updateDescToggles() {
        container.querySelectorAll(".team-card:not(.hidden) .team-desc").forEach(desc => {
          const btn = desc.nextElementSibling;
          if (!btn || desc.classList.contains("expanded")) return;
          btn.hidden = desc.scrollHeight <= desc.clientHeight + 1;
        });
      }
      updateDescToggles();
      document.fonts?.ready.then(updateDescToggles);
      window.addEventListener("resize", updateDescToggles);

      function applyFilter(activeKey) {
        const cards = container.querySelectorAll(".team-card");

        container.querySelectorAll(".team-empty").forEach(el => el.remove());

        const tab = TABS.find(t => t.key === activeKey);
        const matchKeys = tab?.match || [activeKey];

        let visibleCount = 0;
        cards.forEach(card => {
          const match = activeKey === "all" || matchKeys.includes(card.dataset.category);
          card.classList.toggle("hidden", !match);
          if (match) visibleCount++;
        });

        container.querySelectorAll(".team-row-break").forEach(el => {
          el.hidden = activeKey !== "all";
        });

        if (visibleCount === 0) {
          const empty = document.createElement("p");
          empty.classList.add("team-empty");
          empty.textContent = "No team members found in this category.";
          container.appendChild(empty);
        }

        updateDescToggles();
      }

      filterBar.addEventListener("click", e => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;

        filterBar.querySelectorAll(".filter-btn").forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        applyFilter(btn.dataset.filter);
      });

      const collabContainer = document.getElementById("teamContainer1");
      data.Collaborators.forEach(member => {
        const card = document.createElement("div");
        card.classList.add("team-card");
        card.innerHTML = `
          <img src="${member.image}" alt="${member.name}" class="team-img" loading="lazy">
          <div class="team-content">
            <h3 class="team-name">${member.name}</h3>
            <p class="team-role">${member.role}</p>
            <p class="team-desc">${member.description}</p>
            <div class="social-links">
              ${compactSocialLinks(member)}
            </div>
          </div>
        `;
        collabContainer.appendChild(card);
      });

      const statsGrid = document.getElementById("statsGrid");
      data.Stats.forEach(stat => {
        const item = document.createElement("div");
        item.classList.add("stat-item");
        item.innerHTML = `
          <div class="stat-value">${stat.value}</div>
          <div class="stat-divider"></div>
          <h3 class="stat-title">${stat.title}</h3>
          <p class="stat-desc">${stat.description}</p>
        `;
        statsGrid.appendChild(item);
      });

      function buildLogoCard(client, isClone) {
        const a = document.createElement("a");
        a.href = client.url;
        a.classList.add("client-card");
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `<img src="${client.logo}" alt="${client.name} logo" loading="lazy">`;
        if (isClone) {
          a.setAttribute("aria-hidden", "true");
          a.tabIndex = -1;
        }
        return a;
      }

      const logoContainer = document.getElementById("clientsContainer");
      data.Logo.forEach(client => logoContainer.appendChild(buildLogoCard(client, false)));
      data.Logo.forEach(client => logoContainer.appendChild(buildLogoCard(client, true)));

      const expertContainer = document.getElementById("expertiseContainer");
      renderExpertise(data.Expert);
      animateBars();

      function renderExpertise(items) {
        expertContainer.innerHTML = items.map(item => `
          <div class="expertise-card">
            <div class="expertise-icon">${getIcon(item.icon)}</div>
            <h3 class="expertise-title">${item.title}</h3>
            <div class="level-row">
              <span class="level-text">${item.level}</span>
              <div class="progress-bar">
                <div class="progress-fill" data-width="${item.percentage}%"></div>
              </div>
            </div>
            <p class="expertise-description">${item.description}</p>
          </div>
        `).join("");
      }

      function animateBars() {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.width = entry.target.dataset.width;
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });
        document.querySelectorAll(".progress-fill").forEach(bar => observer.observe(bar));
      }

      function getIcon(type) {
        const icons = {
          palette: `<i class="bi bi-palette2 expert-logo"></i>`,
          code:    `<i class="bi bi-code-slash expert-logo"></i>`,
          chart:   `<i class="bi bi-graph-up expert-logo"></i>`,
          team:    `<i class="bi bi-people-fill expert-logo"></i>`,
          bulb:    `<i class="bi bi-lightbulb expert-logo"></i>`,
          gear:    `<i class="bi bi-gear expert-logo"></i>`
        };
        return icons[type] || "⭐";
      }
    })
    .catch(err => console.error("Error loading team data:", err));
});

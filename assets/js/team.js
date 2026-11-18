const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

// Tab definitions: label → category key(s) in JSON.
// `match` lists every category the tab shows (defaults to [key]).
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

// Only these categories show a photo on their card; everyone else
// (UG, student, project staff, alumni) gets a text-only card.
const PHOTO_CATEGORIES = ["postdoc", "phd", "ms", "mtech"];

// Escape text from JSON before putting it into HTML
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// One labelled detail line — skipped entirely when the value is empty
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

      /* ── Ribbon ── */
      document.getElementById("ribbonTitle").innerText = data.ribbon.title;
      document.getElementById("ribbonDesc").innerText  = data.ribbon.description;

      /* ── Team section with filter tabs ── */
      const teamSection = document.querySelector(".team-section");
      const container   = document.getElementById("teamContainer");

      // Inject filter tabs before the grid
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

      // Icon set: Email, Google Scholar, Profile (LinkedIn) — used for student cards & collaborators
      // Icons always render, even when a value is missing from the data — a
      // missing link just falls back to "#" instead of hiding the icon.
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

      // Icon set: ResearchGate, Email, LinkedIn, GitHub — default for team cards
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

      // Co-guide gets its own separate row on the card
      function coGuideRow(member) {
        if (!member.coGuide || !member.coGuide.trim()) return "";
        return `
          <div class="team-coguide">
            <span class="team-detail-label">Co-Guide</span>
            <span class="team-coguide-name">${esc(member.coGuide)}</span>
          </div>`;
      }

      // Alumni card (no photo): name, degree graduated, thesis title, current role
      function alumniCardBody(member) {
        const graduated = [member.degree, member.gradYear && `Graduated ${member.gradYear}`]
          .filter(Boolean).join(" · ");
        return `
          <h3 class="team-name">${esc(member.name)}</h3>
          ${graduated ? `<p class="team-role">${esc(graduated)}</p>` : ""}
          ${detailRow("Thesis", member.thesis)}
          ${detailRow("Current Role", member.currentRole)}
        `;
      }

      // Current member card. PhD layout: name, role, graduation year,
      // thesis title, area of interest. Co-guide + social icons sit in a
      // footer pinned to the bottom, so every card in a row lines up.
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
            ${coGuideRow(member)}
            <div class="social-links">
              ${member.category === "student" ? compactSocialLinks(member) : fullSocialLinks(member)}
            </div>
          </div>
        `;
      }

      // Photo cards first, text-only cards (alumni etc.) after, so rows
      // don't mix tall photo cards with short text cards.
      const hasPhoto = m => PHOTO_CATEGORIES.includes(m.category || "other") && m.image;
      const members = [...data.Team.filter(hasPhoto), ...data.Team.filter(m => !hasPhoto(m))];

      // Text-only cards start on a fresh row (see .team-row-break) so a
      // short card never gets stretched next to a tall photo card.
      const firstTextOnly = members.find(m => !hasPhoto(m));

      // Render all team cards
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

      // Descriptions are clamped to 3 lines so cards stay the same size;
      // a "Read more" toggle appears only on cards whose text is cut off.
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

      // Filter logic
      function applyFilter(activeKey) {
        const cards = container.querySelectorAll(".team-card");

        // Remove stale empty state
        container.querySelectorAll(".team-empty").forEach(el => el.remove());

        const tab = TABS.find(t => t.key === activeKey);
        const matchKeys = tab?.match || [activeKey];

        let visibleCount = 0;
        cards.forEach(card => {
          const match = activeKey === "all" || matchKeys.includes(card.dataset.category);
          card.classList.toggle("hidden", !match);
          if (match) visibleCount++;
        });

        // Row break only matters when both kinds of card are visible
        container.querySelectorAll(".team-row-break").forEach(el => {
          el.hidden = activeKey !== "all";
        });

        // Show empty state if no matches
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

      /* ── Collaborators ── */
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

      /* ── Open Positions / Hiring ── */
      const positionsContainer = document.getElementById("positionsContainer");
      if (positionsContainer) {
        const positions = data.Positions || [];
        positionsContainer.innerHTML = positions.length
          ? positions.map(pos => {
              const external = /^https?:\/\//i.test(pos.link || "");
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
                  ${pos.link ? `
                    <a class="position-btn" href="${esc(pos.link)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
                      ${esc(pos.linkLabel || "Apply / Enquire")}
                    </a>` : ""}
                </article>`;
            }).join("")
          : `<p class="positions-empty">
               There are no open positions at the moment. Motivated candidates are
               welcome to <a href="./contact.html">get in touch</a>.
             </p>`;
      }

      /* ── Stats ── */
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

      /* ── Logos (rendered twice back-to-back for a seamless, gapless
             marquee loop — see .clients-track's translateX(-50%) animation) ── */
      function buildLogoCard(client, isClone) {
        const a = document.createElement("a");
        a.href = client.url;
        a.classList.add("client-card");
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `<img src="${client.logo}" alt="${client.name} logo" loading="lazy">`;
        if (isClone) {
          // Hide the duplicated set from assistive tech / keyboard nav so
          // screen readers and tab order don't see each logo twice.
          a.setAttribute("aria-hidden", "true");
          a.tabIndex = -1;
        }
        return a;
      }

      const logoContainer = document.getElementById("clientsContainer");
      data.Logo.forEach(client => logoContainer.appendChild(buildLogoCard(client, false)));
      data.Logo.forEach(client => logoContainer.appendChild(buildLogoCard(client, true)));

      /* ── Expertise ── */
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
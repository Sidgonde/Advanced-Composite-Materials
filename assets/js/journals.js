const container = document.getElementById("journalsContainer");
const recentContainer = document.getElementById("recentCards");

const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : "";

fetch(`${BASE_PATH}/data/journals.json`)
  .then(res => res.json())
  .then(data => {

    /* ================= RIBBON ================= */

    document.getElementById("ribbonTitle").innerText = data.ribbon.title;
    document.getElementById("ribbonDesc").innerText = data.ribbon.description;

    /* ================= RECENT HIGHLIGHTS ================= */

    document.getElementById("recentTitle").innerText =
      data["recent-highlights"]["recent-section-title"];
    document.getElementById("recentSubtitle").innerText =
      data["recent-highlights"]["recent-section-subtitle"];

    data["recent-highlights"].cards.forEach(card => {

      const div = document.createElement("div");
      div.classList.add("recent-card");

      div.innerHTML = `
        <span class="badge">${card["recent-badge"]}</span>
        <h3>${card["recent-title"]}</h3>
        <p class="meta">${card["recent-authors"]}</p>
        <p class="description">${card["recent-description"]}</p>
        <button class="read-more-btn">Read More</button>
        <div class="buttons">
          <a href="${card["recent-link"]}" target="_blank">View</a>
        </div>
      `;

      recentContainer.appendChild(div);
    });

    /* ================= PUBLICATIONS ================= */

    data.publications.forEach((item, index) => {

      const card = item.card;
      const div = document.createElement("div");
      div.classList.add("journal-card");

      if (index % 2 !== 0) {
        div.classList.add("reverse");
      }

      div.innerHTML = `
        <div class="journal-image">
          <img src="${card.thumbnail}" alt="">
        </div>

        <div class="journal-content">
          <h3>${card["card-heading"]}</h3>

          <div class="meta">
            ${card["author-name"]} • ${card.year} • ${card.citation}
          </div>

          <div class="meta">
            <strong>${card["publication-title"]}</strong>
          </div>

          <p class="description">${card.description}</p>

          <button class="read-more-btn">Read More</button>

          <div class="tags">
            ${card.tags.map(tag => `<span>${tag}</span>`).join("")}
          </div>

          <div class="buttons">
            <a href="${card["view-link"]}" target="_blank">View</a>
            <a href="${card.doi}" target="_blank">DOI</a>
          </div>
        </div>
      `;

      container.appendChild(div);
    });

    /* ================= READ MORE FUNCTION ================= */

    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("read-more-btn")) {

        const card = e.target.closest(".journal-content, .recent-card");
        const description = card.querySelector(".description");

        description.classList.toggle("expanded");

        e.target.textContent =
          description.classList.contains("expanded")
            ? "Read Less"
            : "Read More";
      }
    });

  })
  .catch(error => console.error("Error loading JSON:", error));

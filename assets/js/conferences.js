// Conferences page: conferences, invited talks, proceedings with type tabs.
import { fetchJSON } from "./utils.js";

document.addEventListener("DOMContentLoaded", function () {
  const timeline = document.getElementById("conferenceTimeline");
  const tabs = document.querySelectorAll(".tab");
  let allItems = [];


  function highlightName(text, name) {
    if (!text) return "";
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, `<span class="highlight-name">$1</span>`);
  }

  fetchJSON("conferences.json")
    .then((data) => {
      document.getElementById("ribbonTitle").innerHTML = data.ribbon.title;
      document.getElementById("ribbonDesc").innerHTML = data.ribbon.description;

      const conferences = data["Conferences"].map((item) => ({ ...item, type: "Conference" }));
      const talks       = data["Invited Talks"].map((item) => ({ ...item, type: "Talk" }));
      const proceedings = data["Conference Proceedings"].map((item) => ({ ...item, type: "Proceeding" }));

      allItems = [...conferences, ...talks, ...proceedings];
      renderTimeline(allItems);
    })
    .catch((err) => console.error("Conferences load failed:", err));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const filter = tab.dataset.filter;
      renderTimeline(filter === "all" ? allItems : allItems.filter((i) => i.type === filter));
    });
  });

  function renderTimeline(items) {
    timeline.innerHTML = "";

    items.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("timeline-item");

      if (item.type === "Talk") {
        const yearMatch = item.event.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : ".";

        div.innerHTML = `
          <div class="year">${year}</div>
          ${year ? '<div class="dot"></div>' : ""}
          <div class="conf-card">
            <span class="badge talk">Talk</span>
            <h3>${item.title}</h3>
            <div class="authors">${highlightName(item.event, "Nagappa Siddgonde")}</div>
            <div class="journal">${item.venue}</div>
          </div>
        `;
      } else {
        const yearMatch = item.journal.match(/\d{4}/);
        const year = yearMatch ? yearMatch[0] : ".";
        const badgeClass = item.type === "Conference" ? "conference" : "proceeding";

        div.innerHTML = `
          <div class="year">${year}</div>
          ${year ? '<div class="dot"></div>' : ""}
          <div class="conf-card">
            <span class="badge ${badgeClass}">${item.type}</span>
            <h3>${item.title}</h3>
            <div class="authors">${highlightName(item.authors, "Nagappa Siddgonde")}</div>
            <div class="journal">${item.journal}</div>
            ${item.doi ? `<a class="doi-link" href="${item.doi}" target="_blank" rel="noopener">DOI: ${item.doi.replace(/^https?:\/\//, "")}</a>` : ""}
          </div>
        `;
      }

      timeline.appendChild(div);
    });
  }
});

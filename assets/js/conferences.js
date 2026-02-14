document.addEventListener("DOMContentLoaded", function () {

  const timeline = document.getElementById("conferenceTimeline");
  const tabs = document.querySelectorAll(".tab");

  let allItems = [];   // must be global

  const BASE_PATH = window.location.hostname.includes("github.io")
    ? "/Advanced-Composite-Materials"
    : "";

  fetch(`${BASE_PATH}/data/conferences.json`)
    .then(res => res.json())
    .then(data => {

      // Ribbon
      document.getElementById("ribbonTitle").innerText = data.ribbon.title;
      document.getElementById("ribbonDesc").innerText = data.ribbon.description;

      // Merge talks + proceedings
      const talks = data["Conference Talks"].map(item => ({
        ...item,
        type: "Talk"
      }));

      const proceedings = data["Conference Proceedings"].map(item => ({
        ...item,
        type: "Proceeding"
      }));

      allItems = [...talks, ...proceedings];

      renderTimeline(allItems);
    });

  // Filter Click
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const filter = tab.dataset.filter;

      if (filter === "all") {
        renderTimeline(allItems);
      } else {
        const filtered = allItems.filter(item => item.type === filter);
        renderTimeline(filtered);
      }
    });
  });

  function renderTimeline(items) {

    timeline.innerHTML = "";

    items.forEach(item => {

      const yearMatch = item.journal.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : "";

      const div = document.createElement("div");
      div.classList.add("timeline-item");

      div.innerHTML = `
        <div class="year">${year}</div>
        ${year ? '<div class="dot"></div>' : ''}

        <div class="conf-card">
          <span class="badge ${item.type === "Talk" ? "talk" : "proceeding"}">
            ${item.type}
          </span>

          <h3>${item.title}</h3>
          <div class="authors">${item.authors}</div>
          <div class="journal">${item.journal}</div>
        </div>
      `;

      timeline.appendChild(div);
    });
  }

});

export function createCarousel({ images, id = "carousel", interval = 3000 }) {
  if (!images || !images.length) return "";
  const indicators = images.map((_, i) => `
    <button type="button"
      data-bs-target="#${id}"
      data-bs-slide-to="${i}"
      class="${i === 0 ? "active" : ""}"
      aria-current="${i === 0 ? "true" : "false"}"
      aria-label="Slide ${i + 1}">
    </button>
  `).join("");
  const items = images.map((img, i) => `
    <div class="carousel-item ${i === 0 ? "active" : ""}">
      <img src="${img}" class="d-block w-100 main-img" alt="carousel image">
    </div>
  `).join("");
  return `
    <div id="${id}" class="carousel slide"
      data-bs-ride="false"
      data-bs-interval="${interval}">
      <div class="carousel-indicators">${indicators}</div>
      <div class="carousel-inner">${items}</div>
      <button class="carousel-control-prev" type="button"
        data-bs-target="#${id}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon"></span>
      </button>
      <button class="carousel-control-next" type="button"
        data-bs-target="#${id}" data-bs-slide="next">
        <span class="carousel-control-next-icon"></span>
      </button>
    </div>
  `;
}
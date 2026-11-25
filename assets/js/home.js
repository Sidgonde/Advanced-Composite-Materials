// Home page: research cards, "Who are we" (slider + features), stats counters, particle background.
import { esc, fetchJSON } from "./utils.js";
import { icon } from "./icons.js";
import { createCard, cardIcon } from "../../components/card.js";
import { createCarousel } from "../../components/carousel.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function loadServices() {
  const container = document.getElementById("servicesContainer");
  if (!container) return;
  const data = await fetchJSON("index.json");

  container.innerHTML = data.services.map((service, i) => `
    <div class="reveal" style="transition-delay:${i * 80}ms">${createCard(service)}</div>
  `).join("");
}

// Click a slide to view it enlarged; the slider pauses while the zoom view is open.
function enableCarouselZoom(carouselEl, carousel) {
  if (!carouselEl) return;

  const overlay = document.createElement("div");
  overlay.className = "img-zoom-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Enlarged image");
  overlay.innerHTML = `
    <button type="button" class="img-zoom-close" aria-label="Close">${icon("x", { size: 24 })}</button>
    <img class="img-zoom-img" alt="">`;
  document.body.appendChild(overlay);

  const zoomImg = overlay.querySelector(".img-zoom-img");
  const closeBtn = overlay.querySelector(".img-zoom-close");

  const open = (src, alt) => {
    zoomImg.src = src;
    zoomImg.alt = alt || "";
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    carousel.pause();
    closeBtn.focus();
  };

  const close = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
    carousel.cycle();
  };

  carouselEl.querySelectorAll(".carousel-item img").forEach(img => {
    img.classList.add("zoomable");
    img.title = "Click to enlarge";
    img.addEventListener("click", () => open(img.src, img.alt));
  });

  overlay.addEventListener("click", e => {
    if (e.target !== zoomImg) close();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
}

async function loadAbout() {
  const data = await fetchJSON("index.json");
  const about = data.aboutSection;

  document.getElementById("aboutTag").textContent = about.tag;
  document.getElementById("aboutTitle").textContent = about.title;
  document.getElementById("aboutDesc").textContent = about.description;

  document.getElementById("aboutCarousel").innerHTML = createCarousel({
    id: "aboutCarouselId",
    images: about.images,
  });

  const aboutCarousel = new bootstrap.Carousel("#aboutCarouselId", {
    interval: 4000,
    ride: reduceMotion ? false : "carousel",
    pause: false,
    touch: true,
  });
  enableCarouselZoom(document.getElementById("aboutCarouselId"), aboutCarousel);

  document.getElementById("featureList").innerHTML = about.features.map(item => `
    <div class="feature-item">
      <div class="feature-icon">${cardIcon(item.icon)}</div>
      <div>
        <div class="feature-title">${esc(item.title)}</div>
        <div class="feature-text">${esc(item.text)}</div>
      </div>
    </div>`).join("");
}

function animateCounter(spanEl, circleEl, target) {
  const paint = value => {
    spanEl.textContent = `${value}%`;
    circleEl.style.background =
      `conic-gradient(var(--highlight) ${value * 3.6}deg, #eee ${value * 3.6}deg)`;
  };
  if (reduceMotion) return paint(target);

  const duration = 1800;
  const startTime = performance.now();
  const step = now => {
    const progress = Math.min((now - startTime) / duration, 1);
    paint(Math.round((1 - Math.pow(1 - progress, 3)) * target));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function loadStats() {
  const container = document.getElementById("statsContainer");
  if (!container) return;
  const items = await fetchJSON("stats.json");
  container.innerHTML = "";

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const { span, circle, value } = entry.target._counter;
      animateCounter(span, circle, value);
    });
  }, { threshold: 0.5 });

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "stat-card reveal";
    card.innerHTML = `
      <div class="circle" style="background:conic-gradient(var(--highlight) 0deg, #eee 0deg)"><span>0%</span></div>
      <div class="stat-info">
        <small>${esc(item.tag)}</small>
        <h3>${esc(item.label)}</h3>
        <p>${esc(item.desc)}</p>
      </div>`;
    container.appendChild(card);

    const circle = card.querySelector(".circle");
    card._counter = { span: circle.querySelector("span"), circle, value: item.value };
    io.observe(card);
  });
}

// Animated network of particles behind the hero (paused when off-screen, static for reduced motion).
function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  const landing = document.getElementById("landing");
  if (!canvas || !landing) return;

  const ctx = canvas.getContext("2d");
  const PARTICLE_COUNT = window.innerWidth < 600 ? 45 : 80;
  let particles = [];
  let animId = null;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const makeParticle = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
  });

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(88, 227, 225, 0.8)";
      ctx.fill();
    }
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance < 120) {
          ctx.strokeStyle = `rgba(88,227,225,${1 - distance / 120})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  const tick = () => {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }
    draw();
    animId = requestAnimationFrame(tick);
  };

  resize();
  particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
  window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });

  if (reduceMotion) return draw();

  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && animId === null) {
        tick();
      } else if (!entry.isIntersecting && animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });
  }, { threshold: 0.01 }).observe(landing);
}

initParticles();
loadServices().catch(err => console.error("Services load failed:", err));
loadAbout().catch(err => console.error("About section load failed:", err));
loadStats().catch(err => console.error("Stats load failed:", err));

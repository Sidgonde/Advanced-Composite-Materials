// Runs on every page: navbar + footer, active link, sticky header, scroll reveal, icons.
import { BASE_PATH } from "./utils.js";
import { hydrateIcons } from "./icons.js";
import { renderFooter } from "./footer.js";

async function loadHTML(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return false;
  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`${filePath} not found`);
    target.innerHTML = await res.text();
    return true;
  } catch (err) {
    console.error("HTML Load Error:", err);
    return false;
  }
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("nav.desktop-nav a, .sidebar a").forEach(link => {
    if (link.getAttribute("href") !== currentPage) return;
    link.classList.add("active");

    const dropdown = link.closest(".dropdown");
    if (dropdown) {
      dropdown.classList.add("open");
      dropdown.querySelector(":scope > a")?.classList.add("active");
    }
  });

  document.querySelectorAll(".contact-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = `${BASE_PATH}/contact.html`;
    });
  });
}

window.toggleSidebar = () => {
  const isOpen = document.getElementById("sidebar")?.classList.toggle("show");
  document.querySelector(".hamburger")?.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

window.toggleDropdown = el => {
  const isOpen = el?.parentElement?.classList.toggle("open");
  el?.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

// Fade-in on scroll for .reveal elements, and <i data-icon> → SVG, including content added later.
function initDynamicContent() {
  const io = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      io.unobserve(entry.target);
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  const scan = () => {
    document.querySelectorAll(".reveal:not(.observed)").forEach(el => {
      el.classList.add("observed");
      io.observe(el);
    });
    hydrateIcons(document);
  };

  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
}

function initStickyHeader() {
  const header = document.querySelector("header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  loadHTML("navbar-placeholder", `${BASE_PATH}/components/navbar.html`).then(ok => {
    if (!ok) return;
    setActiveNav();
    initStickyHeader();
  });

  loadHTML("footer-placeholder", `${BASE_PATH}/components/footer.html`).then(ok => {
    if (ok) renderFooter();
  });

  initDynamicContent();
});

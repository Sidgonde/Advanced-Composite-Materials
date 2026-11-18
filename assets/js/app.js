const BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Advanced-Composite-Materials"
  : ".";

async function loadHTML(targetId, filePath, onLoad) {
  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`${filePath} not found`);

    const html = await res.text();
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = html;
    onLoad && onLoad();
  } catch (err) {
    console.error("HTML Load Error:", err);
  }
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop();

  const activateLinks = (selector) => {
    document.querySelectorAll(selector).forEach(link => {
      const href = link.getAttribute("href");

      if (href === currentPage) {
        link.classList.add("active");

        const dropdown = link.closest(".dropdown");
        if (dropdown) {
          dropdown.classList.add("open");

          const parentLink = dropdown.querySelector(":scope > a");
          parentLink && parentLink.classList.add("active");
        }
      }
    });
  };

  activateLinks("nav.desktop-nav a");
  activateLinks(".sidebar a");
  document.querySelectorAll(".contact-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    window.location.href = `${BASE_PATH}/contact.html`;
  });
});
}

window.toggleSidebar = () => {
  const isOpen = document.getElementById("sidebar")?.classList.toggle("show");
  const btn = document.querySelector(".hamburger");
  if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

window.toggleDropdown = (el) => {
  const isOpen = el?.parentElement?.classList.toggle("open");
  if (el) el.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

function initScrollReveal() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      io.unobserve(entry.target);
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  function observeNew() {
    document.querySelectorAll(".reveal:not(.observed)").forEach(el => {
      el.classList.add("observed");
      io.observe(el);
    });
  }

  observeNew();

  new MutationObserver(observeNew).observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function initStickyHeader() {
  const header = document.querySelector("header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  loadHTML(
    "navbar-placeholder",
    `${BASE_PATH}/components/navbar.html`,
    () => {
      setActiveNav();
      initStickyHeader();
    }
  );

  loadHTML(
    "footer-placeholder",
    `${BASE_PATH}/components/footer.html`,
    () => {
      const script = document.createElement("script");
      script.src = `${BASE_PATH}/assets/js/footer.js`;
      document.body.appendChild(script);
    }
  );

  initScrollReveal();
});

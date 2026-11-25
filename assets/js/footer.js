// Fills the shared footer (components/footer.html) from data/footer.json.
import { esc, fetchJSON, assetUrl } from "./utils.js";
import { icon } from "./icons.js";

function socialLink(href, label, iconHTML) {
  if (!href || href === "#") return "";
  return `<a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${label}" title="${label}">${iconHTML}</a>`;
}

export async function renderFooter() {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;

  try {
    const data = await fetchJSON("footer.json");
    const { contact } = data;
    const socials = contact.socials || {};

    footer.querySelector(".footer-logo").textContent = data.logoTitle;
    footer.querySelector(".footer-desc").textContent = data.description;

    footer.querySelector(".social-icons").innerHTML = [
      socialLink(socials.linkedin, "LinkedIn", icon("linkedin", { size: 15 })),
      socialLink(socials.g_scholar, "Google Scholar", icon("google-scholar", { size: 16 })),
      socialLink(socials.researchgate, "ResearchGate", `<span class="footer-researchgate-icon" aria-hidden="true"></span>`),
      socialLink(socials.twitter, "Twitter / X", icon("x", { size: 14 })),
    ].join("");

    footer.querySelector(".footer-links").innerHTML = data.quickLinks
      .map(link => `<li><a href="${esc(link.url)}">${esc(link.label)}</a></li>`)
      .join("");

    footer.querySelector(".contact-location").innerHTML =
      `${icon("map-pin", { size: 15 })}<span>${esc(contact.location)}</span>`;
    footer.querySelector(".contact-email").innerHTML =
      `${icon("mail", { size: 15 })}<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`;
    footer.querySelector(".contact-phone").innerHTML =
      `${icon("phone", { size: 15 })}<a href="tel:${esc(contact.phone.replace(/[^\d+]/g, ""))}">${esc(contact.phone)}</a>`;

    const mapLink = footer.querySelector(".map-link");
    mapLink.href = data.map.link;
    mapLink.querySelector(".map-image").src = assetUrl(data.map.image);

    footer.querySelector(".footer-institute-logo").src = assetUrl(data.instituteLogo);
    footer.querySelector(".footer-lab-logo").src = assetUrl(data.labLogo);

    footer.querySelector(".footer-copyright").textContent = `© ${new Date().getFullYear()} ${data.copyright}`;
  } catch (err) {
    console.error("Footer load failed:", err);
  }
}

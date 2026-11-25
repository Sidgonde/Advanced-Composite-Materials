// Contact page: heading/subtitle/email/social links from data/contact.json + form submit.
import { fetchJSON } from "./utils.js";

const form = document.getElementById("contactForm");

// Formspree receives one message field, so the subject is folded into it.
form?.addEventListener("submit", e => {
  e.preventDefault();
  const { subject, message } = form;
  message.value = `Subject: ${subject.value}\n\n${message.value}`;
  form.submit();
  form.reset();
});

function setLink(id, href) {
  const link = document.getElementById(id);
  if (!link) return;
  if (href && href !== "#") link.href = href;
  else link.hidden = true;
}

fetchJSON("contact.json")
  .then(data => {
    document.querySelector(".contact-form-wrapper h2").innerHTML = data.title;
    document.querySelector(".subtitle").innerHTML = data.subtitle;
    document.getElementById("emailid").textContent = data.email;
    setLink("twitter-link", data.socials?.twitter);
    setLink("linkedin-link", data.socials?.linkedin);
  })
  .catch(err => console.error("Failed to load contact.json", err));

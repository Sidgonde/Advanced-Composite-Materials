// import { card } from "/project-root/components/card.js";
import { createCard } from "../../components/card.js";


// Inject Navbar
fetch("/project-root/components/navbar.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("navbar-placeholder").innerHTML = data;
  });


// Inject Footer
fetch("/project-root/components/footer.html")
  .then(res => res.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
  });

fetch("/project-root/components/card.js")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("servicesContainer");
    console.log(data);
    data.services.forEach(service => {
      container.innerHTML += createCard(service);
    });
  })
  .catch(err => console.error("JSON Load Error:", err));

  fetch("/project-root/index.json")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("servicesContainer");

    data.services.forEach(service => {
      container.innerHTML += createCard(service);
    });
  });

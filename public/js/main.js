const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const currentYear = document.querySelector("#current-year");
const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (contactForm && feedback) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const nome = String(formData.get("nome") || "").trim();
    const empresa = String(formData.get("empresa") || "").trim();

    feedback.textContent =
      nome && empresa
        ? `${nome}, recebemos seu interesse para a ${empresa}. Agora voce pode conectar este formulario ao canal oficial da smweb.`
        : "Formulario pronto para ser ligado ao seu atendimento.";
    feedback.classList.add("is-success");

    contactForm.reset();
  });
}

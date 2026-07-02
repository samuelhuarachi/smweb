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
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const nome = String(formData.get("nome") || "").trim();
        const empresa = String(formData.get("empresa") || "").trim();
        const objetivo = String(formData.get("objetivo") || "").trim();
        const submitButton = contactForm.querySelector("button[type=\"submit\"]");

        feedback.classList.remove("is-success");

        if (!nome || !empresa || !objetivo) {
            feedback.textContent = "Preencha todos os campos antes de enviar.";
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        feedback.textContent = "Enviando sua mensagem...";

        try {
            const response = await fetch("/contact/send-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome,
                    empresa,
                    objetivo,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Erro ao enviar mensagem.");
            }

            feedback.textContent = `${nome}, recebemos seu interesse para a ${empresa}. Em breve entraremos em contato.`;
            feedback.classList.add("is-success");

            contactForm.reset();
        } catch (error) {
            feedback.textContent = error.message || "Nao foi possivel enviar sua mensagem agora.";
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

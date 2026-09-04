(() => {
  "use strict";

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (form) {
    const courseParam = new URLSearchParams(window.location.search).get("kurz");
    const courseMap = {
      gymnastika: "Gymnastika",
      "vfresh-dc": "VFRESH DC",
      telovychova: "Tělovýchova",
      hopik: "Hopík",
      "dramaticky-klub": "Dramatický klub",
      viktorianek: "Viktoriánek",
    };
    if (courseParam && courseMap[courseParam]) {
      form.category.value = courseMap[courseParam];
    }
  }

  if (form && note) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = form.name.value.trim();
      const category = form.category.value;
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        note.textContent = "Vyplňte prosím jméno, e-mail a zprávu.";
        note.style.color = "#e8483d";
        return;
      }

      if (window.VTStore) {
        VTStore.submissions.add({ name, email, category, message, status: "new" });
      }

      const subject = encodeURIComponent(`Dotaz z webu — ${category}`);
      const body = encodeURIComponent(
        `Jméno: ${name}\nKategorie: ${category}\nE-mail: ${email}\n\n${message}`
      );

      window.location.href = `mailto:lena.cimpova@seznam.cz?subject=${subject}&body=${body}`;

      note.textContent = "Přihláška uložena a otevírá se e-mailový klient s vyplněnou zprávou…";
      note.style.color = "#0fa3a3";
      form.reset();
    });
  }
})();

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

  // Rozvrh: filtr podle programu (dny a řádky vykresluje render-public.js).
  const week = document.querySelector(".tt-week");
  if (week) {
    const filters = [...document.querySelectorAll(".tt-filter")];
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        const group = btn.dataset.ttFilter;
        week.querySelectorAll(".tt-slot").forEach((slot) => {
          slot.classList.toggle("is-dim", group !== "all" && slot.dataset.group !== group);
        });
      });
    });
  }

  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  const pageLoadedAt = Date.now();

  // Odeslání e-mailu klubu přes api/prihlaska.php (SMTP Seznam Email Profi).
  async function sendMail(payload) {
    try {
      const res = await fetch("/api/prihlaska.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data.ok === true;
    } catch (e) {
      console.warn("E-mail s přihláškou se nepodařilo odeslat.", e);
      return false;
    }
  }

  if (form) {
    const courseParam = new URLSearchParams(window.location.search).get("kurz");
    const courseMap = {
      gymnastika: "Sportovní gymnastika",
      telovychova: "Sportuj s VIKTORKOU",
      zumba: "Zumba & Dance",
      "dramaticky-klub": "Dramatický klub",
      viktorianek: "Viktoriánek",
    };
    if (courseParam && courseMap[courseParam]) {
      form.category.value = courseMap[courseParam];
    }
  }

  if (form && note) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = form.name.value.trim();
      const category = form.category.value;
      const email = form.email.value.trim();
      const phone = form.phone ? form.phone.value.trim() : "";
      const message = form.message.value.trim();
      const consent = !!(form.consent && form.consent.checked);

      if (!name || !email || !message) {
        note.textContent = "Vyplňte prosím jméno, e-mail a zprávu.";
        note.style.color = "#b3261e";
        return;
      }

      if (!consent) {
        note.textContent = "Pro odeslání potvrďte prosím souhlas se zpracováním osobních údajů.";
        note.style.color = "#b3261e";
        return;
      }

      // Skryté pole vyplní jen robot: tváříme se, že je odesláno.
      const website = form.website ? form.website.value.trim() : "";
      const elapsed = Date.now() - pageLoadedAt;
      if (website || elapsed < 2500) {
        note.textContent = "Děkujeme, přihláška dorazila. Ozveme se co nejdřív.";
        note.style.color = "#2a1646";
        form.reset();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      note.textContent = "Odesíláme…";
      note.style.color = "#2a1646";

      // Přihláška se uloží do databáze (admin) a zároveň odejde e-mailem.
      let saved = false;
      if (window.VTStore) {
        try {
          await VTStore.submissions.add({ name, email, phone: phone || null, category, message, status: "new", consent: true });
          saved = true;
        } catch (e) {
          console.warn("Přihlášku se nepodařilo uložit do databáze.", e);
        }
      }
      const mailed = await sendMail({ name, email, phone, category, message, consent: true, saved, website, elapsed });

      if (submitBtn) submitBtn.disabled = false;
      if (saved || mailed) {
        note.textContent = "Děkujeme, přihláška dorazila. Ozveme se co nejdřív.";
        note.style.color = "#2a1646";
        form.reset();
        return;
      }

      // Nevyšlo nic: otevře se e-mail s vyplněnou zprávou, aby se dotaz neztratil.
      const subject = encodeURIComponent(`Dotaz z webu: ${category}`);
      const body = encodeURIComponent(
        `Jméno: ${name}\nKategorie: ${category}\nE-mail: ${email}\nTelefon: ${phone}\n\n${message}`
      );
      note.textContent = "Přihlášku se nepodařilo odeslat, otevírá se e-mail s vyplněnou zprávou…";
      note.style.color = "#b3261e";
      window.location.href = `mailto:info@viktoria-tabor.cz?subject=${subject}&body=${body}`;
    });
  }
})();

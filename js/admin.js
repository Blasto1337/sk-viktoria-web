(() => {
  "use strict";

  if (!window.VTStore) {
    document.querySelector(".admin-main").innerHTML =
      "<p class='admin-empty'>Administrace potřebuje localStorage, který se v tomto prohlížeči nepodařilo načíst.</p>";
    return;
  }

  // ---- read-only snapshots of what's hand-written into the site today ----
  const STATIC_AKTUALITY = [
    { date: "1. 9. 2026, 14:00", text: "Slavnostní otevření nového centra Viktoria Fresh Dance Center v Centru Univerzity Tábor." },
    { date: "1.–3. 9. 2026", text: "Zápis do kurzů a registrace na zkušební lekce — 1. 9. odpolední kurzy, 3. 9. celodenní kurzy." },
  ];

  const STATIC_AKCE = [
    { tag: "ZÁPIS", date: "7. 9. 2026", title: "VFRESH DC — den otevřených dveří", href: "akce-vfresh-dc.html" },
    { tag: "NÁBOR", date: "2. 9. 2026", title: "Dramatický klub — ukázkové hodiny zdarma", href: "akce-dramaticky-klub.html" },
    { tag: "NÁBOR", date: "9. 9. 2026", title: "Sportuj s Viktorkou — nábor na ZŠ Helsinská", href: "akce-sportuj-s-viktorkou.html" },
    { tag: "NÁBOR", date: "10. 9. 2026", title: "Viktoria Fresh Mates — nábor pro rodiče", href: "akce-fresh-mates.html" },
  ];

  const STATIC_KROUZKY = [
    { icon: "🥇", name: "Sportovní gymnastika", age: "5–15 let", href: "kurz-gymnastika.html" },
    { icon: "💃", name: "VFRESH DC", age: "3–20 let", href: "kurz-vfresh-dc.html" },
    { icon: "🏃", name: "Rekreační tělovýchova", age: "4–12 let", href: "kurz-telovychova.html" },
    { icon: "🤸", name: "Klub Hopík", age: "3–6 let", href: "kurz-hopik.html" },
    { icon: "🎭", name: "Dramatický klub", age: "3–12 let", href: "kurz-dramaticky-klub.html" },
    { icon: "🧸", name: "Viktoriánek", age: "1,5–3 roky", href: "kurz-viktorianek.html" },
  ];

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso;
    }
  }

  // ---------------------------------------------------------------- tabs --
  const tabs = [...document.querySelectorAll(".admin-tab")];
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach((panel) => {
        panel.hidden = panel.dataset.panel !== tab.dataset.tab;
      });
    });
  });

  function updateCounts() {
    document.getElementById("count-submissions").textContent = VTStore.submissions.all().length;
    document.getElementById("count-aktuality").textContent = VTStore.aktuality.all().length;
    document.getElementById("count-akce").textContent = VTStore.akce.all().length;
    document.getElementById("count-krouzky").textContent = VTStore.krouzky.all().length;
  }

  // ---------------------------------------------------------- submissions --
  let submissionFilter = "all";

  function renderSubmissions() {
    const list = document.getElementById("submissions-list");
    const empty = document.getElementById("submissions-empty");
    const all = VTStore.submissions.all();
    const filtered = submissionFilter === "all" ? all : all.filter((s) => s.status === submissionFilter);

    empty.hidden = all.length > 0;
    if (all.length === 0) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = filtered.map((s) => `
      <div class="admin-card" data-id="${s.id}">
        <div class="admin-card-main">
          <div class="admin-card-title">${escapeHtml(s.name)} <span class="tag tag-teal">${escapeHtml(s.category)}</span></div>
          <div class="admin-card-meta">${escapeHtml(s.email)} · ${escapeHtml(fmtDate(s.createdAt))}</div>
          <p class="admin-card-message">${escapeHtml(s.message)}</p>
        </div>
        <div class="admin-card-actions">
          <span class="status-badge status-${s.status}">${s.status === "done" ? "Vyřízeno" : "Nové"}</span>
          <button class="btn-mini" data-action="toggle-submission" data-id="${s.id}">${s.status === "done" ? "↺ Vrátit" : "✓ Vyřízeno"}</button>
          <button class="btn-mini btn-mini-danger" data-action="delete-submission" data-id="${s.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  document.querySelectorAll("#panel-submissions .filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#panel-submissions .filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      submissionFilter = btn.dataset.status;
      renderSubmissions();
    });
  });

  document.getElementById("submissions-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "toggle-submission") {
      const s = VTStore.submissions.get(id);
      VTStore.submissions.update(id, { status: s.status === "done" ? "new" : "done" });
      renderSubmissions();
      updateCounts();
    } else if (btn.dataset.action === "delete-submission") {
      if (confirm("Smazat tuto přihlášku?")) {
        VTStore.submissions.remove(id);
        renderSubmissions();
        updateCounts();
      }
    }
  });

  // ------------------------------------------------------------ aktuality --
  function renderAktualityStatic() {
    document.getElementById("aktuality-static-list").innerHTML = STATIC_AKTUALITY.map((a) => `
      <div class="admin-static-item">
        <span class="admin-static-tag">web</span>
        <span>${a.icon || "📢"} <b>${escapeHtml(a.date)}</b> — ${escapeHtml(a.text)}</span>
      </div>
    `).join("");
  }

  function renderAktuality() {
    const list = document.getElementById("aktuality-list");
    const empty = document.getElementById("aktuality-empty");
    const items = VTStore.aktuality.all();
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((a) => `
      <div class="admin-card" data-id="${a.id}">
        <div class="admin-card-main">
          <div class="admin-card-title">${escapeHtml(a.icon || "📢")} ${escapeHtml(a.date)}</div>
          <p class="admin-card-message">${escapeHtml(a.text)}</p>
        </div>
        <div class="admin-card-actions">
          <button class="btn-mini btn-mini-danger" data-action="delete-aktualita" data-id="${a.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("form-aktualita").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    VTStore.aktuality.add({
      icon: f.icon.value.trim() || "📢",
      date: f.date.value.trim(),
      text: f.text.value.trim(),
    });
    f.reset();
    renderAktuality();
    updateCounts();
  });

  document.getElementById("aktuality-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='delete-aktualita']");
    if (!btn) return;
    if (confirm("Smazat tuto aktualitu?")) {
      VTStore.aktuality.remove(btn.dataset.id);
      renderAktuality();
      updateCounts();
    }
  });

  // ----------------------------------------------------------------- akce --
  function renderAkceStatic() {
    document.getElementById("akce-static-list").innerHTML = STATIC_AKCE.map((a) => `
      <div class="admin-static-item">
        <span class="admin-static-tag">web</span>
        <span><b>${escapeHtml(a.date)}</b> — ${escapeHtml(a.title)}</span>
        <a href="${a.href}" target="_blank" rel="noopener">Zobrazit</a>
      </div>
    `).join("");
  }

  function renderAkce() {
    const list = document.getElementById("akce-list");
    const empty = document.getElementById("akce-empty");
    const items = VTStore.akce.all();
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((a) => `
      <div class="admin-card" data-id="${a.id}">
        <div class="admin-card-main">
          <div class="admin-card-title"><span class="tag tag-${a.color}">${escapeHtml(a.tag)}</span> ${escapeHtml(a.title)}</div>
          <div class="admin-card-meta">${escapeHtml(a.date)}${a.location ? " · " + escapeHtml(a.location) : ""}</div>
          <p class="admin-card-message">${escapeHtml(a.description || "")}</p>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="akce-detail.html?id=${encodeURIComponent(a.id)}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini btn-mini-danger" data-action="delete-akce" data-id="${a.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("form-akce").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const bullets = f.bullets.value.split("\n").map((s) => s.trim()).filter(Boolean);
    VTStore.akce.add({
      tag: f.tag.value.trim() || "AKCE",
      color: f.color.value,
      category: f.category.value,
      title: f.title.value.trim(),
      date: f.date.value.trim(),
      location: f.location.value.trim(),
      description: f.description.value.trim(),
      bullets,
    });
    f.reset();
    renderAkce();
    updateCounts();
  });

  document.getElementById("akce-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='delete-akce']");
    if (!btn) return;
    if (confirm("Smazat tuto akci?")) {
      VTStore.akce.remove(btn.dataset.id);
      renderAkce();
      updateCounts();
    }
  });

  // -------------------------------------------------------------- kroužky --
  function renderKrouzkyStatic() {
    document.getElementById("krouzky-static-list").innerHTML = STATIC_KROUZKY.map((k) => `
      <div class="admin-static-item">
        <span class="admin-static-tag">web</span>
        <span>${k.icon} <b>${escapeHtml(k.name)}</b> — ${escapeHtml(k.age)}</span>
        <a href="${k.href}" target="_blank" rel="noopener">Zobrazit</a>
      </div>
    `).join("");
  }

  function renderKrouzky() {
    const list = document.getElementById("krouzky-list");
    const empty = document.getElementById("krouzky-empty");
    const items = VTStore.krouzky.all();
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((k) => `
      <div class="admin-card" data-id="${k.id}">
        <div class="admin-card-main">
          <div class="admin-card-title">${escapeHtml(k.icon || "⭐")} ${escapeHtml(k.name)} <span class="tag tag-teal">${escapeHtml(k.age || "Novinka")}</span></div>
          <div class="admin-card-meta">${escapeHtml(k.location || "")}</div>
          <p class="admin-card-message">${escapeHtml(k.description || "")}</p>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="kurz-detail.html?id=${encodeURIComponent(k.id)}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini btn-mini-danger" data-action="delete-krouzek" data-id="${k.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("form-krouzek").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const schedule = f.schedule.value.split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
      const [label, time] = line.split("|").map((s) => (s || "").trim());
      return { label: label || "", time: time || "" };
    });
    VTStore.krouzky.add({
      icon: f.icon.value.trim() || "⭐",
      color: f.color.value,
      name: f.name.value.trim(),
      age: f.age.value.trim() || "Novinka",
      location: f.location.value.trim(),
      description: f.description.value.trim(),
      schedule,
    });
    f.reset();
    renderKrouzky();
    updateCounts();
  });

  document.getElementById("krouzky-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='delete-krouzek']");
    if (!btn) return;
    if (confirm("Smazat tento kroužek?")) {
      VTStore.krouzky.remove(btn.dataset.id);
      renderKrouzky();
      updateCounts();
    }
  });

  // ----------------------------------------------------------------- misc --
  document.getElementById("reset-all").addEventListener("click", () => {
    if (!confirm("Opravdu smazat všechna data přidaná v administraci (přihlášky, aktuality, akce, kroužky)? Napevno napsaný obsah webu zůstane beze změny.")) return;
    VTStore.submissions.clear();
    VTStore.aktuality.clear();
    VTStore.akce.clear();
    VTStore.krouzky.clear();
    renderAll();
  });

  function renderAll() {
    renderSubmissions();
    renderAktualityStatic();
    renderAktuality();
    renderAkceStatic();
    renderAkce();
    renderKrouzkyStatic();
    renderKrouzky();
    updateCounts();
  }

  renderAll();
})();

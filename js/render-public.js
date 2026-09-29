/*
  Vykreslí obsah z VTStore (Supabase / záloha) do veřejných stránek:
  hero slider, kroužky, akce, rozvrh, aktuality a výběr kategorie ve formuláři.
  Každý blok se vykreslí jen tam, kde na stránce existuje jeho kontejner.
*/
(() => {
  "use strict";

  if (!window.VTStore) return;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Obrázek, nebo placeholder s popisem, jaká fotka se hodí (admin: „Popis fotky“).
  function mediaHtml(photo, hint, alt, extraClass) {
    const cls = extraClass ? ` class="${extraClass}"` : "";
    if (photo) return `<img${cls} src="${esc(photo)}" alt="${esc(alt || "")}" loading="lazy">`;
    const label = hint ? `foto: ${hint}` : `foto: ${alt || "doplníme"}`;
    return `<div class="ph${extraClass ? " " + extraClass : ""}" role="img" aria-label="${esc(alt || "")}"><span>${esc(label)}</span></div>`;
  }

  // Odkazy na druhý web (Web VFRESH DC ↗) berou adresu z VTStore.siteUrls.
  document.querySelectorAll("[data-vt-site-link]").forEach((link) => {
    const url = VTStore.siteUrls && VTStore.siteUrls[link.dataset.vtSiteLink];
    if (url) link.href = url;
  });

  // ------------------------------------------------------------- data --
  const isVfresh = (k) => k.group === "vfresh";

  function krouzekHref(item) {
    return VTStore.hrefFor(item, `kurz-detail.html?id=${encodeURIComponent(item.id)}`);
  }
  function akceHref(item) {
    return item.detailHref || `akce-detail.html?id=${encodeURIComponent(item.id)}`;
  }
  function contactHref(name) {
    const base = document.getElementById("contact-form") ? "" : "index.html";
    return `${base}?kurzname=${encodeURIComponent(name)}#kontakt`;
  }

  // Datum akce z textu („16. 9. 2026“, „28.10.2026“) pro řazení a velké číslo dne.
  const MONTHS = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];
  function parseDate(label) {
    const m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})?/.exec(String(label || ""));
    if (!m) return null;
    const year = m[3] ? Number(m[3]) : new Date().getFullYear();
    return { day: Number(m[1]), month: Number(m[2]), date: new Date(year, Number(m[2]) - 1, Number(m[1])) };
  }
  // Nadcházející akce vzestupně, potom proběhlé od nejnovější. Nic se neskrývá (to řeší admin).
  function sortEvents(items) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return items
      .map((it, i) => ({ it, i, d: parseDate(it.date) }))
      .sort((a, b) => {
        if (!a.d && !b.d) return a.i - b.i;
        if (!a.d) return 1;
        if (!b.d) return -1;
        const aPast = a.d.date < today, bPast = b.d.date < today;
        if (aPast !== bPast) return aPast ? 1 : -1;
        return aPast ? b.d.date - a.d.date : a.d.date - b.d.date;
      })
      .map((x) => x.it);
  }

  // ------------------------------------------------------ hero slider --
  function heroSlides() {
    const byOrder = (a, b) => (a.heroOrder ?? 100) - (b.heroOrder ?? 100);
    const courses = VTStore.krouzky.all().filter((k) => k.hero && !isVfresh(k)).map((k) => ({
      order: k.heroOrder, type: "Aktivita", title: k.name, lead: k.heroLead || k.description,
      age: k.age, when: k.when, place: k.location, photo: k.photo, hint: k.photoHint,
      cta: "Zkušební lekce zdarma", ctaHref: contactHref(k.name),
      more: "Zjistit víc", moreHref: krouzekHref(k),
    }));
    const events = VTStore.akce.all().filter((a) => a.hero).map((a) => ({
      order: a.heroOrder, type: a.category === "nabor" ? "Nábor" : "Akce", title: a.title,
      lead: a.heroLead || a.description, age: a.age, when: a.date, place: a.location,
      photo: a.photo, hint: a.photoHint,
      cta: a.category === "nabor" ? "Přihlásit se" : "Chci přijít", ctaHref: contactHref(a.title),
      more: "Detail akce", moreHref: akceHref(a),
    }));
    const slides = [...courses, ...events].sort((a, b) => byOrder({ heroOrder: a.order }, { heroOrder: b.order }));
    if (slides.length) return slides;
    // Bez vybraných snímků: jeden úvodní snímek o klubu.
    return [{
      type: "Nábor", title: "Hýbeme se celý rok", lead: "Aktivity pro děti od 1,5 roku i pro rodiče: gymnastika, pohybové hry, divadlo, cvičení s dětmi a Zumba.",
      age: "od 1,5 roku", when: "celý týden", place: "Tábor a Planá n. L.", hint: "děti a rodiče při cvičení v sále",
      cta: "Zkušební lekce zdarma", ctaHref: "#kontakt", more: "Všechny aktivity", moreHref: "krouzky.html",
    }];
  }

  function renderHero() {
    const textBox = document.getElementById("hero-slides");
    const mediaBox = document.getElementById("hero-media");
    if (!textBox || !mediaBox) return;
    const slides = heroSlides();
    const pad = (n) => String(n).padStart(2, "0");

    textBox.innerHTML = slides.map((s, i) => `
      <div class="hero-slide${i === 0 ? " is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} z ${slides.length}"${i === 0 ? "" : ' aria-hidden="true"'}>
        <div class="hero-tags"><span class="hero-type">${esc(s.type)}</span><span class="hero-season">Sezóna 2026/27</span></div>
        ${i === 0 ? `<h1>${esc(s.title)}</h1>` : `<h2 class="h1-like">${esc(s.title)}</h2>`}
        ${s.lead ? `<p class="hero-lead">${esc(s.lead)}</p>` : ""}
        <dl class="hero-meta">
          ${s.age ? `<div><dt>Pro koho</dt><dd>${esc(s.age)}</dd></div>` : ""}
          ${s.when ? `<div><dt>Kdy</dt><dd>${esc(s.when)}</dd></div>` : ""}
          ${s.place ? `<div><dt>Kde</dt><dd>${esc(s.place)}</dd></div>` : ""}
        </dl>
        <div class="hero-actions">
          <a class="btn btn-gold btn-lg" href="${esc(s.ctaHref)}"${i === 0 ? "" : ' tabindex="-1"'}>${esc(s.cta)}</a>
          <a class="btn btn-outline-light btn-lg" href="${esc(s.moreHref)}"${i === 0 ? "" : ' tabindex="-1"'}>${esc(s.more)}</a>
        </div>
      </div>`).join("");
    mediaBox.innerHTML = slides.map((s, i) => mediaHtml(s.photo, s.hint, s.title, i === 0 ? "is-active" : "")).join("");

    const controls = document.getElementById("hero-controls");
    if (slides.length < 2) return;
    controls.hidden = false;
    const dots = document.getElementById("hero-dots");
    dots.innerHTML = slides.map((_, i) => `<button type="button" class="hero-dot${i === 0 ? " is-active" : ""}" aria-label="Snímek ${i + 1}"></button>`).join("");
    const counter = document.getElementById("hero-counter");

    const textLayers = [...textBox.children];
    const mediaLayers = [...mediaBox.children];
    const dotBtns = [...dots.children];
    let current = 0;
    let timer = null;
    let paused = false;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(n) {
      current = (n + slides.length) % slides.length;
      textLayers.forEach((l, i) => {
        const on = i === current;
        l.classList.toggle("is-active", on);
        l.setAttribute("aria-hidden", String(!on));
        l.querySelectorAll("a").forEach((a) => { if (on) a.removeAttribute("tabindex"); else a.setAttribute("tabindex", "-1"); });
      });
      mediaLayers.forEach((l, i) => l.classList.toggle("is-active", i === current));
      dotBtns.forEach((d, i) => d.classList.toggle("is-active", i === current));
      counter.innerHTML = `${pad(current + 1)} <span>/ ${pad(slides.length)}</span>`;
    }
    function restart() {
      clearInterval(timer);
      if (reduced) return;
      timer = setInterval(() => { if (!paused) go(current + 1); }, 6500);
    }
    document.getElementById("hero-prev").addEventListener("click", () => { go(current - 1); restart(); });
    document.getElementById("hero-next").addEventListener("click", () => { go(current + 1); restart(); });
    dotBtns.forEach((d, i) => d.addEventListener("click", () => { go(i); restart(); }));
    const hero = document.getElementById("hero");
    hero.addEventListener("mouseenter", () => { paused = true; });
    hero.addEventListener("mouseleave", () => { paused = false; });
    hero.addEventListener("focusin", () => { paused = true; });
    hero.addEventListener("focusout", (e) => { if (!hero.contains(e.relatedTarget)) paused = false; });
    go(0);
    restart();
  }

  // ------------------------------------------------------------ kroužky --
  function courseCardHtml(item, hidden) {
    return `
      <a class="course-card" href="${esc(krouzekHref(item))}" data-vt-id="${item.id}"${hidden ? " hidden" : ""}>
        <div class="course-media">
          ${mediaHtml(item.photo, item.photoHint, item.name)}
          ${item.age ? `<span class="age-badge">${esc(item.age)}</span>` : ""}
        </div>
        <div class="course-body">
          <h3>${esc(item.name)}</h3>
          ${item.description ? `<p>${esc(item.description)}</p>` : ""}
          <div class="course-foot">
            <span class="course-when">${esc(item.when || "")}</span>
            <span class="course-place">${esc(item.location || "")}</span>
          </div>
        </div>
      </a>`;
  }

  function vfreshCardHtml(vfreshItems, withList) {
    const url = (VTStore.siteUrls && VTStore.siteUrls.vfresh) || "#";
    const list = withList && vfreshItems.length
      ? `<ul class="vfresh-list">${vfreshItems.map((k) => `<li>${esc(k.name)}${k.age ? ` · ${esc(k.age)}` : ""}</li>`).join("")}</ul>`
      : "";
    return `
      <a class="course-card course-card-vfresh" href="${esc(url)}">
        <span class="eyebrow">Taneční kurzy</span>
        <div>
          <h3>VFRESH DC</h3>
          <p style="margin-top:12px">Street dance pro děti i dospělé od 3 let. Od taneční školičky FRESHÍK po soutěžní crew.</p>
        </div>
        ${list}
        <span class="vfresh-link">Web VFRESH DC ↗</span>
      </a>`;
  }

  // Homepage ukazuje vždy 6 karet: 5 aktivit + na šestém, pevném místě karta
  // VFRESH DC. Když je featured aktivit víc, zbytek se skryje za tlačítko.
  function renderCourses() {
    const all = VTStore.krouzky.all();
    const vfreshItems = all.filter(isVfresh);
    const preview = document.getElementById("courses-grid-preview");
    if (preview) {
      const featured = all.filter((k) => k.featured && !isVfresh(k));
      const shown = featured.slice(0, 5);
      const rest = featured.slice(5);
      preview.innerHTML =
        shown.map((k) => courseCardHtml(k)).join("") +
        vfreshCardHtml(vfreshItems, false) +
        rest.map((k) => courseCardHtml(k, true)).join("") +
        (rest.length ? `<button type="button" class="btn btn-purple btn-more-courses" id="courses-more-btn">Zobrazit další aktivity</button>` : "");
      const moreBtn = document.getElementById("courses-more-btn");
      if (moreBtn) {
        moreBtn.addEventListener("click", () => {
          preview.querySelectorAll(".course-card[hidden]").forEach((el) => { el.hidden = false; });
          moreBtn.remove();
        });
      }
    }
    const full = document.getElementById("courses-grid");
    if (full) {
      full.innerHTML = all.filter((k) => !isVfresh(k)).map((k) => courseCardHtml(k)).join("") + vfreshCardHtml(vfreshItems, true);
    }
  }

  // --------------------------------------------------------------- akce --
  function eventRowHtml(item) {
    const d = parseDate(item.date);
    const dateHtml = d
      ? `<div class="event-date"><span class="event-day">${d.day}</span><span class="event-mon">${MONTHS[d.month - 1] || ""}</span></div>`
      : `<div class="event-date"><span class="event-date-text">${esc(item.date || "")}</span></div>`;
    return `
      <a class="event-row" href="${esc(akceHref(item))}" data-filter-type="${esc(item.category || "nabor")}" data-vt-id="${item.id}">
        ${dateHtml}
        <span class="tag-pill">${esc(item.tag || "Akce")}</span>
        <div class="event-main">
          <h3>${esc(item.title)}</h3>
          ${item.description ? `<p>${esc(item.description)}</p>` : ""}
          ${item.location ? `<p class="event-place">📍 ${esc(item.location)}</p>` : ""}
        </div>
        <span class="event-link">Detail akce →</span>
      </a>`;
  }

  function renderEvents() {
    const preview = document.getElementById("events-grid-preview");
    if (preview) {
      const items = sortEvents(VTStore.akce.all().filter((a) => a.featured));
      preview.innerHTML = items.length ? items.map(eventRowHtml).join("") : '<p class="lead">Akce brzy doplníme.</p>';
    }
    const full = document.getElementById("events-grid");
    if (full) {
      full.innerHTML = sortEvents(VTStore.akce.all()).map(eventRowHtml).join("");
      const active = document.querySelector(".filter-btn.active");
      if (active && active.dataset.filter !== "all") {
        full.querySelectorAll(".event-row").forEach((row) => row.classList.toggle("is-hidden", row.dataset.filterType !== active.dataset.filter));
      }
    }
  }

  // ------------------------------------------------------------- rozvrh --
  function renderTimetable() {
    const week = document.getElementById("tt-week");
    if (!week) return;
    const DAYS = { 1: "Pondělí", 2: "Úterý", 3: "Středa", 4: "Čtvrtek", 5: "Pátek", 6: "Sobota", 7: "Neděle" };
    const slots = VTStore.rozvrh.all().filter((r) => r.published !== false);
    const hasWeekend = slots.some((r) => r.weekday > 5);
    const days = hasWeekend ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
    const today = new Date().getDay() || 7;
    week.style.setProperty("--tt-cols", days.length);
    week.innerHTML = days.map((d) => {
      const list = slots.filter((r) => r.weekday === d);
      const items = list.length
        ? list.map((r) => {
            const group = ["vfresh", "zumba", "volnocas"].includes(r.program) ? r.program : "volnocas";
            return `<li class="tt-slot tt-${group}" data-group="${group}"><time>${esc(r.time)}</time><span class="tt-name">${esc(r.name)}</span>${r.note ? `<span class="tt-note">${esc(r.note)}</span>` : ""}</li>`;
          }).join("")
        : '<li class="tt-empty">Žádná lekce</li>';
      return `<div class="tt-day${d === today ? " is-today" : ""}"><h3 class="tt-dayname">${DAYS[d]}</h3><ul class="tt-slots">${items}</ul></div>`;
    }).join("");
    const active = document.querySelector(".tt-filter.active");
    if (active && active.dataset.ttFilter !== "all") {
      week.querySelectorAll(".tt-slot").forEach((s) => s.classList.toggle("is-dim", s.dataset.group !== active.dataset.ttFilter));
    }
  }

  // ---------------------------------------------------------- aktuality --
  function renderNews() {
    const list = document.getElementById("alerts-list");
    if (!list) return;
    const items = VTStore.aktuality.all();
    const section = document.getElementById("aktuality");
    list.innerHTML = items.length ? items.map((n) => {
      // Bez nadpisu se jako nadpis použije první věta textu.
      let title = n.title;
      let text = n.text || "";
      if (!title) {
        const m = /^(.+?[.!?:])\s+(.*)$/s.exec(text);
        title = m ? m[1].replace(/[:.]$/, "") : text;
        text = m ? m[2] : "";
      }
      return `
        <article class="news-item" data-vt-id="${n.id}">
          ${n.date ? `<div class="news-date">${esc(n.date)}</div>` : ""}
          <h3>${esc(title)}</h3>
          ${text ? `<p>${esc(text)}</p>` : ""}
          ${n.photo ? `<img src="${esc(n.photo)}" alt="" loading="lazy">` : ""}
        </article>`;
    }).join("") : '<p class="lead" style="margin-top:24px">Zatím žádné novinky.</p>';
    if (section) section.hidden = false;
  }

  // ------------------------------------------------ formulář: kategorie --
  function renderCategories() {
    const select = document.getElementById("f-category");
    if (!select) return;
    const jine = [...select.options].find((o) => o.value === "Jiné");
    VTStore.krouzky.all().forEach((item) => {
      if ([...select.options].some((o) => o.value === item.name)) return;
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = `${item.name}${item.age ? ` (${item.age})` : ""}`;
      if (jine) select.insertBefore(opt, jine); else select.appendChild(opt);
    });
    selectCategory(categoryFromUrl(new URL(window.location.href)));
  }

  // ?kurz=zumba (odkazy ze statických stránek kroužků) nebo ?kurzname=Název
  const KURZ = { gymnastika: "Sportovní gymnastika", telovychova: "Sportuj s VIKTORKOU", zumba: "Zumba & Dance", "dramaticky-klub": "Dramatický klub", viktorianek: "Viktoriánek" };
  function categoryFromUrl(url) {
    return url.searchParams.get("kurzname") || KURZ[url.searchParams.get("kurz")] || null;
  }
  function selectCategory(name) {
    const select = document.getElementById("f-category");
    if (!select || !name) return;
    if (![...select.options].some((o) => o.value === name)) {
      const jine = [...select.options].find((o) => o.value === "Jiné");
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      select.insertBefore(opt, jine || null);
    }
    select.value = name;
  }

  // ------------------------------------- odkazy na kontaktní formulář --
  // Na stránce s formulářem (homepage) se odkaz „…#kontakt“ nenačítá znovu:
  // jen předvyplní kroužek a plynule sjede k formuláři. Dřív odkaz s ?kurzname
  // stránku znovu načetl a skok na #kontakt proběhl dřív, než se vykreslil
  // obsah z databáze, takže stránka skončila jinde.
  function scrollToContact(smooth) {
    const target = document.getElementById("kontakt");
    if (!target) return;
    target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    const name = document.getElementById("f-name");
    if (name && smooth) setTimeout(() => name.focus({ preventScroll: true }), 600);
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!document.getElementById("contact-form")) return;
    const url = new URL(link.getAttribute("href"), window.location.href);
    const samePage = url.origin === window.location.origin && url.pathname.replace(/index\.html$/, "") === window.location.pathname.replace(/index\.html$/, "");
    if (!samePage || url.hash !== "#kontakt") return;
    e.preventDefault();
    selectCategory(categoryFromUrl(url));
    history.replaceState(null, "", url.search ? `${url.search}#kontakt` : "#kontakt");
    scrollToContact(true);
  });

  function render() {
    renderHero();
    renderCourses();
    renderEvents();
    renderTimetable();
    renderNews();
    renderCategories();
    // Příchod z jiné stránky na index.html#kontakt (nebo jinou kotvu): po vykreslení
    // obsahu z databáze se pozice posune, proto na kotvu skočíme znovu.
    if (window.location.hash.length > 1) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
  }

  VTStore.ready.then(render);
})();

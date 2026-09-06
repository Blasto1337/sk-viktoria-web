/*
  Renders content added through the admin prototype (js/admin.js, stored via
  VTStore) into the public pages. Static hand-written cards stay in the HTML;
  this only appends what an admin has added on top.
*/
(() => {
  "use strict";

  if (!window.VTStore) return;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // --- Aktuality -----------------------------------------------------
  const alertsList = document.getElementById("alerts-list");
  if (alertsList) {
    VTStore.aktuality.all().forEach((item) => {
      alertsList.appendChild(el(`
        <div class="alert-item" data-vt-id="${item.id}">
          <span class="alert-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg></span>
          <div>
            <div class="alert-date">${escapeHtml(item.date)}</div>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </div>
      `));
    });
  }

  // --- Akce (events) ---------------------------------------------------
  function eventCardHtml(item, withDescription) {
    const tagClass = `tag-${item.color || "teal"}`;
    return `
      <a class="event-card" href="akce-detail.html?id=${encodeURIComponent(item.id)}" data-filter-type="${escapeHtml(item.category || "nabor")}" data-vt-id="${item.id}">
        <div class="ph" aria-hidden="true"><span>foto</span></div>
        <div class="event-body">
          <div class="event-meta"><span class="tag ${tagClass}">${escapeHtml(item.tag || "AKCE")}</span><time>${escapeHtml(item.date)}</time></div>
          <h3>${escapeHtml(item.title)}</h3>
          ${withDescription && item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        </div>
      </a>
    `;
  }

  const eventsPreview = document.getElementById("events-grid-preview");
  if (eventsPreview) {
    VTStore.akce.all().forEach((item) => {
      eventsPreview.appendChild(el(eventCardHtml(item, false)));
    });
  }

  const eventsFull = document.getElementById("events-grid");
  if (eventsFull) {
    VTStore.akce.all().forEach((item) => {
      eventsFull.appendChild(el(eventCardHtml(item, true)));
    });
    // re-apply the current filter so newly injected cards obey it too
    const activeFilter = document.querySelector(".filter-btn.active");
    if (activeFilter && activeFilter.dataset.filter !== "all") {
      const filter = activeFilter.dataset.filter;
      eventsFull.querySelectorAll(".event-card").forEach((card) => {
        if (card.dataset.filterType !== filter) card.classList.add("is-hidden");
      });
    }
  }

  // --- Kroužky (courses) ------------------------------------------------
  // Only the dedicated krouzky.html has #courses-grid — the homepage grid
  // is #courses-grid-preview and intentionally stays a fixed, curated set
  // so it doesn't outgrow the layout as more kroužky get added.
  const coursesGrid = document.getElementById("courses-grid");
  if (coursesGrid) {
    VTStore.krouzky.all().forEach((item) => {
      coursesGrid.appendChild(el(`
        <a class="course-card course-${escapeHtml(item.color || "teal")}" href="kurz-detail.html?id=${encodeURIComponent(item.id)}" data-vt-id="${item.id}">
          <div>
            <div class="course-icon" aria-hidden="true">${escapeHtml(item.icon || "⭐")}</div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description || "")}</p>
            ${item.location ? `<div class="course-loc">📍 ${escapeHtml(item.location)}</div>` : ""}
          </div>
          <div class="course-foot">
            <span class="age-badge">${escapeHtml(item.age || "Novinka")}</span>
            <span class="course-arrow" aria-hidden="true">→</span>
          </div>
        </a>
      `));
    });
  }

  // Contact form category dropdown — present only on the homepage, but
  // independent of which (if any) courses grid exists on this page.
  const categorySelect = document.getElementById("f-category");
  if (categorySelect) {
    const jineOption = [...categorySelect.options].find((o) => o.value === "Jiné");
    VTStore.krouzky.all().forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = `${item.name} (${item.age || "Novinka"})`;
      if (jineOption) categorySelect.insertBefore(opt, jineOption);
      else categorySelect.appendChild(opt);
    });

    const kurzname = new URLSearchParams(window.location.search).get("kurzname");
    if (kurzname) categorySelect.value = kurzname;
  }
})();

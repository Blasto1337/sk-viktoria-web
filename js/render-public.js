/*
  Renders kroužky/akce/aktuality onto the public pages from VTStore.
  Every item — seeded from js/seed.js on first load, or added/edited later
  through admin.html — lives in VTStore and is rendered from there; there
  is no separate hand-written HTML fallback for these grids/lists anymore.
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
    const bellIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>';
    VTStore.aktuality.all().forEach((item) => {
      const iconHtml = item.photo
        ? `<img src="${escapeHtml(item.photo)}" alt="" style="width:22px;height:22px;object-fit:cover;border-radius:50%;display:block">`
        : bellIcon;
      alertsList.appendChild(el(`
        <div class="alert-item" data-vt-id="${item.id}">
          <span class="alert-icon" aria-hidden="true">${iconHtml}</span>
          <div>
            <div class="alert-date">${escapeHtml(item.date)}</div>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </div>
      `));
    });
  }

  // --- Akce (events) ---------------------------------------------------
  function akceHref(item) {
    return item.detailHref || `akce-detail.html?id=${encodeURIComponent(item.id)}`;
  }

  function eventCardHtml(item, withDescription) {
    const tagClass = `tag-${item.color || "teal"}`;
    const media = item.photo
      ? `<img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.title)}" loading="lazy">`
      : `<div class="ph" aria-hidden="true"><span>foto</span></div>`;
    return `
      <a class="event-card" href="${akceHref(item)}" data-filter-type="${escapeHtml(item.category || "nabor")}" data-vt-id="${item.id}">
        ${media}
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
    VTStore.akce.all().filter((item) => item.featured).forEach((item) => {
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
  function krouzekHref(item) {
    return item.detailHref || `kurz-detail.html?id=${encodeURIComponent(item.id)}`;
  }

  function courseCardHtml(item) {
    const iconSvg = window.vtIconSvg ? window.vtIconSvg(item.icon) : "";
    const hasPhoto = !!item.photo;
    const photoHtml = hasPhoto
      ? `<div class="course-photo"><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" loading="lazy"></div>`
      : "";
    const body = `
      <div${hasPhoto ? ' class="course-card-body"' : ""}>
        <div>
          <div class="course-icon" aria-hidden="true">${iconSvg}</div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
          ${item.location ? `<div class="course-loc">📍 ${escapeHtml(item.location)}</div>` : ""}
        </div>
        <div class="course-foot">
          <span class="age-badge">${escapeHtml(item.age || "Novinka")}</span>
          <span class="course-arrow" aria-hidden="true">→</span>
        </div>
      </div>
    `;
    return `
      <a class="course-card course-${escapeHtml(item.color || "teal")}${hasPhoto ? " has-photo" : ""}" href="${krouzekHref(item)}" data-vt-id="${item.id}">
        ${photoHtml}${body}
      </a>
    `;
  }

  const coursesVfresh = document.getElementById("courses-grid-vfresh");
  if (coursesVfresh) {
    VTStore.krouzky.all().filter((item) => item.group === "vfresh").forEach((item) => {
      coursesVfresh.appendChild(el(courseCardHtml(item)));
    });
  }

  const coursesGrid = document.getElementById("courses-grid");
  if (coursesGrid) {
    VTStore.krouzky.all().filter((item) => (item.group || "volnocas") !== "vfresh").forEach((item) => {
      coursesGrid.appendChild(el(courseCardHtml(item)));
    });
  }

  const coursesPreview = document.getElementById("courses-grid-preview");
  if (coursesPreview) {
    VTStore.krouzky.all().filter((item) => item.featured).forEach((item) => {
      coursesPreview.appendChild(el(courseCardHtml(item)));
    });
  }

  // Contact form category dropdown — present only on the homepage, but
  // independent of which (if any) courses grid exists on this page.
  const categorySelect = document.getElementById("f-category");
  if (categorySelect) {
    const jineOption = [...categorySelect.options].find((o) => o.value === "Jiné");
    VTStore.krouzky.all().forEach((item) => {
      if (jineOption && [...categorySelect.options].some((o) => o.value === item.name)) return;
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

// Vykreslí obsah statických stránek kurz-*.html (rozvrh, cena, místo, popis)
// z databázových skupin (vik_groups / vik_schedule_slots / vik_places), aby vše
// spravoval admin a nic nebylo natvrdo v HTML. Stránka jen deklaruje svůj
// page_slug na kontejneru <div id="kurz-groups" data-page-slug="...">.
(() => {
  "use strict";

  if (!window.VTStore) return;

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  const DAY_NAMES = { 1: "Pondělí", 2: "Úterý", 3: "Středa", 4: "Čtvrtek", 5: "Pátek", 6: "Sobota", 7: "Neděle" };
  const CALENDAR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>';

  function formatMoney(n) {
    return `${Number(n).toLocaleString("cs-CZ")} Kč`;
  }

  // Místo se u skupiny nastavuje na rozvrhových termínech (schedule_slots.place_id).
  // V praxi všechny termíny jedné skupiny sdílí jedno místo, bereme první nalezené.
  function renderLocation(slots, placesById) {
    const withPlace = slots.find((s) => s.placeId && placesById.get(s.placeId));
    if (!withPlace) return "";
    const place = placesById.get(withPlace.placeId);
    let line = escapeHtml(place.name);
    if (place.address && !place.name.includes(place.address)) line += `, ${escapeHtml(place.address)}`;
    if (place.note) line += ` (${escapeHtml(place.note)})`;
    return `<p class="course-location">📍 ${line}</p>`;
  }

  function renderSlots(slots) {
    if (!slots.length) return "";
    const rows = slots.map((slot) => {
      const time = slot.endTime ? `${slot.startTime}–${slot.endTime}` : slot.startTime;
      return `
        <div class="course-slot">
          <span class="course-slot-icon" aria-hidden="true">${CALENDAR_ICON}</span>
          <div>
            <div class="course-slot-day">${escapeHtml(DAY_NAMES[slot.weekday] || "")}</div>
            <div class="course-slot-time">${escapeHtml(time)}</div>
            ${slot.note ? `<div class="course-slot-note">${escapeHtml(slot.note)}</div>` : ""}
          </div>
        </div>`;
    }).join("");
    return `<div class="course-slots">${rows}</div>`;
  }

  function renderPrices(group) {
    if (!group.priceCzk && !(Array.isArray(group.priceExtra) && group.priceExtra.length)) return "";
    const chips = [];
    if (group.priceCzk) {
      chips.push(`
        <div class="course-price course-price-main">
          <div class="course-price-value">${formatMoney(group.priceCzk)}</div>
          <div class="course-price-label">${escapeHtml(group.priceNote || "")}</div>
        </div>`);
    }
    (group.priceExtra || []).forEach((extra) => {
      chips.push(`
        <div class="course-price">
          <div class="course-price-value">${escapeHtml(extra.value)}</div>
          <div class="course-price-label">${escapeHtml(extra.label)}</div>
        </div>`);
    });
    return `<div class="course-prices">${chips.join("")}</div>`;
  }

  function renderGroup(group, slotsByGroup, placesById) {
    const slots = slotsByGroup.get(group.id) || [];
    const description = (group.description || "").split("\n").filter(Boolean)
      .map((p) => `<p style="margin-top:12px;font-size:14px;color:#fff;opacity:.85">${escapeHtml(p)}</p>`).join("");
    return `
      <div class="detail-box">
        <h2>${escapeHtml(group.name)}</h2>
        ${renderLocation(slots, placesById)}
        ${renderSlots(slots)}
        ${renderPrices(group)}
        ${group.termNote ? `<p class="course-term">${escapeHtml(group.termNote)}</p>` : ""}
        ${group.trialLesson ? `<p class="course-trial">🎟 Zkušební lekce zdarma${group.trialNote ? ` <b>${escapeHtml(group.trialNote)}</b>` : ""}</p>` : ""}
        ${description}
      </div>`;
  }

  function render() {
    const root = document.getElementById("kurz-groups");
    if (!root) return;
    const pageSlug = root.dataset.pageSlug;
    if (!pageSlug) return;

    const groups = VTStore.skupiny.all()
      .filter((g) => g.pageSlug === pageSlug && g.published !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    if (!groups.length) {
      root.innerHTML = `<div class="detail-box"><p>Obsah bude brzy upřesněn.</p></div>`;
      return;
    }

    const placesById = new Map(VTStore.mista.all().map((p) => [p.id, p]));
    const slotsByGroup = new Map();
    VTStore.rozvrhSkupin.all().filter((s) => s.published !== false).forEach((slot) => {
      if (!slotsByGroup.has(slot.groupId)) slotsByGroup.set(slot.groupId, []);
      slotsByGroup.get(slot.groupId).push(slot);
    });
    slotsByGroup.forEach((list) => list.sort((a, b) => (a.weekday - b.weekday) || String(a.startTime).localeCompare(String(b.startTime))));

    root.innerHTML = groups.map((g) => renderGroup(g, slotsByGroup, placesById)).join("");
  }

  VTStore.ready.then(render);
})();

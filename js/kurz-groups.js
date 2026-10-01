// Boxy kurzů na stránce aktivity (kurz-detail.html): termíny, místo, cena,
// zkušební lekce a popis. Data jsou z databáze: kurzy (vik_groups) patří pod
// aktivitu přes activity_id, termíny (vik_schedule_slots) pod kurz.
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

  function placeLine(place) {
    let line = escapeHtml(place.name);
    if (place.address && !place.name.includes(place.address)) line += `, ${escapeHtml(place.address)}`;
    if (place.note) line += ` (${escapeHtml(place.note)})`;
    return line;
  }

  // Místo se nastavuje u termínů. Když mají všechny termíny stejné místo, ukáže
  // se jednou nad nimi, jinak u každého termínu zvlášť.
  function renderSlots(slots, placesById) {
    if (!slots.length) return "";
    const placeIds = [...new Set(slots.map((s) => s.placeId || ""))];
    const shared = placeIds.length === 1 && placeIds[0] && placesById.get(placeIds[0]);
    const rows = slots.map((slot) => {
      const time = slot.endTime ? `${slot.startTime}–${slot.endTime}` : slot.startTime;
      const own = !shared && slot.placeId && placesById.get(slot.placeId);
      const note = [slot.note, own ? own.shortName || own.name : ""].filter(Boolean).join(" · ");
      return `
        <div class="course-slot">
          <span class="course-slot-icon" aria-hidden="true">${CALENDAR_ICON}</span>
          <div>
            <div class="course-slot-day">${escapeHtml(DAY_NAMES[slot.weekday] || "")}</div>
            <div class="course-slot-time">${escapeHtml(time)}</div>
            ${note ? `<div class="course-slot-note">${escapeHtml(note)}</div>` : ""}
          </div>
        </div>`;
    }).join("");
    return `${shared ? `<p class="course-location">📍 ${placeLine(shared)}</p>` : ""}<div class="course-slots">${rows}</div>`;
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

  function renderGroup(group, placesById) {
    const slots = VTStore.slotsOf(group.id, true);
    const description = (group.description || "").split("\n").filter(Boolean)
      .map((p) => `<p class="course-desc">${escapeHtml(p)}</p>`).join("");
    return `
      <div class="detail-box">
        <h2>${escapeHtml(group.name)}</h2>
        ${group.ageLabel || group.badge ? `<p class="course-age">${escapeHtml([group.ageLabel, group.badge].filter(Boolean).join(" · "))}</p>` : ""}
        ${group.shortDescription ? `<p class="course-note">${escapeHtml(group.shortDescription)}</p>` : ""}
        ${renderSlots(slots, placesById)}
        ${renderPrices(group)}
        ${group.termNote ? `<p class="course-term">${escapeHtml(group.termNote)}</p>` : ""}
        ${group.trialLesson ? `<p class="course-trial">🎟 Zkušební lekce zdarma${group.trialNote ? ` <b>${escapeHtml(group.trialNote)}</b>` : ""}</p>` : ""}
        ${description}
      </div>`;
  }

  function render() {
    const root = document.getElementById("kurz-groups");
    if (!root) return;
    const activity = window.vtCurrentActivity ? window.vtCurrentActivity() : null;
    if (!activity) { root.innerHTML = ""; return; }

    const groups = VTStore.coursesOf(activity.id, true);
    if (!groups.length) {
      root.innerHTML = `<div class="detail-box"><p>Rozvrh a ceny brzy doplníme. Napište nám a ozveme se.</p></div>`;
      return;
    }
    const placesById = new Map(VTStore.mista.all().map((p) => [p.id, p]));
    root.innerHTML = groups.map((g) => renderGroup(g, placesById)).join("");
  }

  VTStore.ready.then(render);
})();

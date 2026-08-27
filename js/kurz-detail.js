(() => {
  "use strict";

  if (!window.VTStore) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const item = id ? VTStore.krouzky.get(id) : null;

  if (!item) {
    document.getElementById("k-root").innerHTML = `
      <section class="detail">
        <div class="wrap">
          <a class="back-link" href="index.html#krouzky">← Zpět na kroužky</a>
          <p class="detail-lead">Tento kroužek jsme nenašli. Možná byl odebrán, nebo si prohlížíte odkaz z jiného zařízení/prohlížeče — data z administrace jsou zatím uložená jen lokálně.</p>
        </div>
      </section>
    `;
    return;
  }

  document.title = `${item.name} — SK Viktoria Tábor`;

  document.getElementById("k-hero").className = `course-hero course-${item.color || "teal"}`;
  document.getElementById("k-icon").textContent = item.icon || "⭐";
  document.getElementById("k-name").textContent = item.name;
  document.getElementById("k-age").textContent = item.age || "Novinka";
  document.getElementById("k-desc").textContent = item.description || "";
  document.getElementById("k-location").textContent = item.location || "Bude upřesněno.";

  const scheduleEl = document.getElementById("k-schedule");
  const schedule = Array.isArray(item.schedule) ? item.schedule : [];
  if (schedule.length) {
    scheduleEl.innerHTML = schedule
      .map((row) => `<li><b>${row.label || ""}</b><span>${row.time || ""}</span></li>`)
      .join("");
  } else {
    scheduleEl.outerHTML = `<p id="k-schedule">Rozvrh bude upřesněn.</p>`;
  }

  const cta = document.getElementById("k-cta");
  cta.href = `index.html?kurzname=${encodeURIComponent(item.name)}#kontakt`;
})();

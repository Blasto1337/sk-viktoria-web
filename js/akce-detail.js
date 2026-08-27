(() => {
  "use strict";

  if (!window.VTStore) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const item = id ? VTStore.akce.get(id) : null;

  if (!item) {
    document.getElementById("a-root").innerHTML = `
      <section class="event-detail">
        <div class="wrap">
          <a class="back-link" href="akce.html">← Zpět na akce</a>
          <p class="detail-lead">Tuto akci jsme nenašli. Možná byla odebrána, nebo si prohlížíte odkaz z jiného zařízení/prohlížeče — data z administrace jsou zatím uložená jen lokálně.</p>
        </div>
      </section>
    `;
    return;
  }

  document.title = `${item.title} — SK Viktoria Tábor`;

  const tagEl = document.getElementById("a-tag");
  tagEl.textContent = item.tag || "AKCE";
  tagEl.className = `tag tag-${item.color || "teal"}`;

  document.getElementById("a-title").textContent = item.title;
  document.getElementById("a-date").textContent = `📅 ${item.date || "—"}`;
  document.getElementById("a-location").textContent = `📍 ${item.location || "Bude upřesněno"}`;

  const listEl = document.getElementById("a-list");
  const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
  if (bullets.length) {
    listEl.innerHTML = bullets.map((b) => `<li>${b}</li>`).join("");
  } else if (item.description) {
    listEl.innerHTML = `<li>${item.description}</li>`;
  }
})();

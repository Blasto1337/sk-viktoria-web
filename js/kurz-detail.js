// Stránka aktivity (kurz-detail.html?a=<slug>, starší odkazy ?id=<uuid>).
// Vše je z databáze: hlavička a úvodní text z aktivity (admin: Aktivity),
// boxy kurzů s termíny a cenami vykreslí js/kurz-groups.js (admin: Kurzy).
(() => {
  "use strict";

  if (!window.VTStore) return;

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Aktivita podle adresy stránky (sdílí se s kurz-groups.js).
  function currentActivity() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("a");
    if (slug) return VTStore.activityBySlug(slug);
    const id = params.get("id");
    return id ? VTStore.krouzky.get(id) : null;
  }
  window.vtCurrentActivity = currentActivity;

  const COLORS = ["teal", "blue", "yellow", "pink", "red", "purple"];

  function render() {
    const item = currentActivity();

    if (!item) {
      document.getElementById("k-root").innerHTML = `
        <section class="detail">
          <div class="wrap">
            <a class="back-link" href="krouzky.html">← Zpět na aktivity</a>
            <p class="detail-lead">Tuto aktivitu jsme nenašli. Možná byla odebrána nebo je odkaz neplatný.</p>
          </div>
        </section>
      `;
      return;
    }

    // Aktivita, která patří na druhý web (VFRESH DC), se zobrazuje tam.
    if (VTStore.isExternal(item)) {
      window.location.replace(VTStore.hrefFor(item));
      return;
    }

    document.title = `${item.name} | SK Viktoria Tábor`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && item.description) meta.setAttribute("content", item.description);

    const color = COLORS.includes(item.color) ? item.color : "teal";
    document.getElementById("k-hero").className = `course-hero course-${color}`;
    document.getElementById("k-root").className = `detail-accent-${color}`;
    document.getElementById("k-name").textContent = item.name;

    const tags = [item.age || "Novinka", item.badge, item.location ? `📍 ${item.location}` : ""].filter(Boolean);
    document.getElementById("k-tags").innerHTML = tags.map((t) => `<span class="age-badge">${escapeHtml(t)}</span>`).join("");

    // Úvodní text: odstavce oddělené prázdným řádkem, první jako perex.
    const paragraphs = String(item.detailLead || item.description || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    document.getElementById("k-lead").innerHTML = paragraphs.map((p, i) => i === 0
      ? `<p class="detail-lead">${escapeHtml(p)}</p>`
      : `<p class="detail-text">${escapeHtml(p)}</p>`).join("");

    const photos = (Array.isArray(item.detailPhotos) ? item.detailPhotos : []).filter((p) => p && p.url);
    if (!photos.length && item.photo) photos.push({ url: item.photo, alt: item.name });
    if (photos.length) {
      document.getElementById("k-photos").innerHTML = photos.map((p) =>
        `<div class="gallery-item"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.alt || item.name)}" loading="lazy"></div>`).join("");
      document.getElementById("k-media").hidden = false;
    }

    document.getElementById("k-cta").href = `index.html?kurzname=${encodeURIComponent(item.name)}#kontakt`;
  }

  VTStore.ready.then(render);
})();

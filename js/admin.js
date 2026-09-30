(() => {
  "use strict";

  if (!window.VTStore) {
    document.querySelector(".admin-main").innerHTML =
      "<p class='admin-empty'>Administraci se nepodařilo načíst. Zkuste stránku obnovit.</p>";
    return;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Admin běží v podsložce /admin/, relativní cesty webu (assets/…, kurz-….html) potřebují ../
  function pub(url) {
    const u = String(url || "");
    return !u || /^(?:[a-z]+:|\/|#|\.\.\/)/i.test(u) ? u : "../" + u;
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return iso;
    }
  }

  // -------------------------------------------------------- photo fields --
  // Fotky se před nahráním zmenší a převedou na JPEG (telefonní fotky mají
  // několik MB), do Supabase Storage se nahrají až při uložení formuláře.
  function compressImage(file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Obrázek se nepodařilo zpracovat."))), "image/jpeg", quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Obrázek se nepodařilo načíst."));
      };
      img.src = objectUrl;
    });
  }

  // Propojí <input type="file" name="photo"> s náhledem a tlačítkem pro odebrání.
  // Aktuální hodnota je buď URL existující fotky, nebo čerstvě vybraný soubor
  // (Blob), který se nahraje voláním commit(). Původní URL si pole pamatuje,
  // aby šla po nahrazení nebo odebrání stará fotka uklidit ze Storage.
  function setupPhotoField(form, rowId, previewId) {
    const fileInput = form.querySelector('input[name="photo"]');
    const row = document.getElementById(rowId);
    const preview = document.getElementById(previewId);
    let current = null;   // string (URL) | { blob, preview } | null
    let original = null;  // URL, se kterou se formulář otevřel

    function show(value) {
      if (current && typeof current !== "string") URL.revokeObjectURL(current.preview);
      current = value || null;
      if (current) {
        preview.src = typeof current === "string" ? pub(current) : current.preview;
        row.hidden = false;
      } else {
        preview.src = "";
        row.hidden = true;
      }
    }

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const blob = await compressImage(file, 1600, 0.82);
        show({ blob, preview: URL.createObjectURL(blob) });
      } catch (e) {
        alert("Tuhle fotku se nepodařilo zpracovat, zkuste prosím jiný soubor.");
        fileInput.value = "";
      }
    });

    row.querySelector("[data-remove-photo]").addEventListener("click", () => {
      fileInput.value = "";
      show(null);
    });

    return {
      set(url) {
        fileInput.value = "";
        original = url || null;
        show(url || null);
      },
      // Nahraje případnou novou fotku a vrátí výslednou URL (nebo null).
      async commit(folder) {
        if (current && typeof current !== "string") {
          return VTStore.uploadPhoto(current.blob, folder);
        }
        return current;
      },
      // Po úspěšném uložení smaže starou fotku, pokud byla nahrazena nebo odebrána.
      cleanup(finalUrl) {
        if (original && original !== finalUrl) VTStore.deletePhoto(original);
        original = finalUrl || null;
      },
    };
  }

  function friendlyError(e) {
    if (e && (e.status === 401 || e.status === 403)) {
      return "Nemáte oprávnění nebo vypršelo přihlášení. Přihlaste se prosím znovu.";
    }
    if (e && e.status) return `Uložení se nepovedlo (${e.message}).`;
    return "Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu.";
  }

  // Provede async zápis; při chybě ukáže srozumitelnou hlášku.
  async function trySave(fn) {
    try {
      await fn();
      return true;
    } catch (e) {
      console.error(e);
      alert(friendlyError(e));
      return false;
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
    document.getElementById("count-rozvrh").textContent = VTStore.timetable().length;
    document.getElementById("count-skupiny").textContent = VTStore.skupiny.all().length;
    document.getElementById("count-galerie").textContent = VTStore.galerie.all().length;
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
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(s.name)} <span class="tag tag-teal">${escapeHtml(s.category)}</span></div>
            <div class="admin-card-meta">${escapeHtml(s.email)} · ${escapeHtml(fmtDate(s.createdAt))}</div>
            <p class="admin-card-message">${escapeHtml(s.message)}</p>
          </div>
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

  document.getElementById("submissions-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "toggle-submission") {
      const s = VTStore.submissions.get(id);
      const ok = await trySave(() => VTStore.submissions.update(id, { status: s.status === "done" ? "new" : "done" }));
      if (!ok) return;
      renderSubmissions();
      updateCounts();
    } else if (btn.dataset.action === "delete-submission") {
      if (confirm("Smazat tuto přihlášku?")) {
        const ok = await trySave(() => VTStore.submissions.remove(id));
        if (!ok) return;
        renderSubmissions();
        updateCounts();
      }
    }
  });

  // ------------------------------------------------------------ aktuality --
  const aktualitaForm = document.getElementById("form-aktualita");
  const aktualitaPhoto = setupPhotoField(aktualitaForm, "aktualita-photo-row", "aktualita-photo-preview");
  let editingAktualitaId = null;

  function resetAktualitaForm() {
    editingAktualitaId = null;
    aktualitaForm.reset();
    aktualitaPhoto.set(null);
    document.getElementById("form-aktualita-title").textContent = "Přidat aktualitu";
    aktualitaForm.querySelector(".btn-submit").textContent = "Přidat aktualitu";
    aktualitaForm.querySelector("[data-cancel-edit]").hidden = true;
    aktualitaForm.classList.remove("is-editing");
  }

  function startEditAktualita(id) {
    const item = VTStore.aktuality.get(id);
    if (!item) return;
    editingAktualitaId = id;
    aktualitaForm.date.value = item.date || "";
    aktualitaForm.title.value = item.title || "";
    aktualitaForm.text.value = item.text || "";
    aktualitaPhoto.set(item.photo || null);
    document.getElementById("form-aktualita-title").textContent = `Upravit aktualitu`;
    aktualitaForm.querySelector(".btn-submit").textContent = "Uložit změny";
    aktualitaForm.querySelector("[data-cancel-edit]").hidden = false;
    aktualitaForm.classList.add("is-editing");
    aktualitaForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderAktuality() {
    const list = document.getElementById("aktuality-list");
    const empty = document.getElementById("aktuality-empty");
    const items = VTStore.aktuality.all();
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((a) => `
      <div class="admin-card" data-id="${a.id}">
        <div class="admin-card-main">
          ${a.photo ? `<img class="admin-card-thumb" src="${escapeHtml(pub(a.photo))}" alt="">` : ""}
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(a.title || "(bez nadpisu)")} ${a.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <div class="admin-card-meta">${escapeHtml(a.date || "")}</div>
            <p class="admin-card-message">${escapeHtml(a.text)}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <button class="btn-mini" data-action="edit-aktualita" data-id="${a.id}">✎ Upravit</button>
          <button class="btn-mini btn-mini-danger" data-action="delete-aktualita" data-id="${a.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  aktualitaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const submitBtn = f.querySelector(".btn-submit");
    submitBtn.disabled = true;
    let finalPhoto = null;
    const ok = await trySave(async () => {
      finalPhoto = await aktualitaPhoto.commit("aktuality");
      const patch = { date: f.date.value.trim(), title: f.title.value.trim() || null, text: f.text.value.trim(), photo: finalPhoto };
      if (editingAktualitaId) {
        await VTStore.aktuality.update(editingAktualitaId, patch);
      } else {
        await VTStore.aktuality.add(patch);
      }
    });
    submitBtn.disabled = false;
    if (!ok) return;
    aktualitaPhoto.cleanup(finalPhoto);
    resetAktualitaForm();
    renderAktuality();
    updateCounts();
  });

  aktualitaForm.querySelector("[data-cancel-edit]").addEventListener("click", resetAktualitaForm);

  document.getElementById("aktuality-list").addEventListener("click", async (e) => {
    const editBtn = e.target.closest("button[data-action='edit-aktualita']");
    if (editBtn) {
      startEditAktualita(editBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest("button[data-action='delete-aktualita']");
    if (delBtn) {
      if (confirm("Smazat tuto aktualitu?")) {
        const id = delBtn.dataset.id;
        const photo = (VTStore.aktuality.get(id) || {}).photo;
        const ok = await trySave(() => VTStore.aktuality.remove(id));
        if (!ok) return;
        VTStore.deletePhoto(photo);
        if (editingAktualitaId === id) resetAktualitaForm();
        renderAktuality();
        updateCounts();
      }
    }
  });

  // Pole pro hero slider (kroužky i akce mají stejná: hero, heroLead, heroOrder).
  function fillHero(form, item) {
    form.hero.checked = !!item.hero;
    form.heroLead.value = item.heroLead || "";
    form.heroOrder.value = item.heroOrder ?? 100;
    form.photoHint.value = item.photoHint || "";
  }
  function readHero(form) {
    const order = parseInt(form.heroOrder.value, 10);
    return {
      hero: form.hero.checked,
      heroLead: form.heroLead.value.trim() || null,
      heroOrder: Number.isFinite(order) ? order : 100,
      photoHint: form.photoHint.value.trim() || null,
    };
  }
  function heroMeta(item) {
    return item.hero ? ` · v hero (pořadí ${item.heroOrder ?? 100})` : "";
  }

  // ----------------------------------------------------------------- akce --
  const akceForm = document.getElementById("form-akce");
  const akcePhoto = setupPhotoField(akceForm, "akce-photo-row", "akce-photo-preview");
  let editingAkceId = null;

  function resetAkceForm() {
    editingAkceId = null;
    akceForm.reset();
    akcePhoto.set(null);
    document.getElementById("form-akce-title").textContent = "Přidat akci";
    akceForm.querySelector(".btn-submit").textContent = "Přidat akci";
    akceForm.querySelector("[data-cancel-edit]").hidden = true;
    akceForm.classList.remove("is-editing");
  }

  function startEditAkce(id) {
    const item = VTStore.akce.get(id);
    if (!item) return;
    editingAkceId = id;
    akceForm.tag.value = item.tag || "";
    akceForm.color.value = item.color || "teal";
    akceForm.category.value = item.category || "nabor";
    akceForm.title.value = item.title || "";
    akceForm.date.value = item.date || "";
    akceForm.location.value = item.location || "";
    akceForm.description.value = item.description || "";
    akceForm.bullets.value = Array.isArray(item.bullets) ? item.bullets.join("\n") : "";
    akceForm.featured.checked = !!item.featured;
    akceForm.age.value = item.age || "";
    fillHero(akceForm, item);
    akcePhoto.set(item.photo || null);
    document.getElementById("form-akce-title").textContent = "Upravit akci";
    akceForm.querySelector(".btn-submit").textContent = "Uložit změny";
    akceForm.querySelector("[data-cancel-edit]").hidden = false;
    akceForm.classList.add("is-editing");
    akceForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderAkce() {
    const list = document.getElementById("akce-list");
    const empty = document.getElementById("akce-empty");
    const items = VTStore.akce.all();
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((a) => `
      <div class="admin-card" data-id="${a.id}">
        <div class="admin-card-main">
          ${a.photo ? `<img class="admin-card-thumb" src="${escapeHtml(pub(a.photo))}" alt="">` : ""}
          <div class="admin-card-main-text">
            <div class="admin-card-title"><span class="tag tag-${a.color}">${escapeHtml(a.tag)}</span> ${escapeHtml(a.title)} ${a.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <div class="admin-card-meta">${escapeHtml(a.date)}${a.location ? " · " + escapeHtml(a.location) : ""}${a.featured ? " · na hlavní straně" : ""}${heroMeta(a)}</div>
            <p class="admin-card-message">${escapeHtml(a.description || "")}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="${escapeHtml(pub(a.detailHref || `akce-detail.html?id=${encodeURIComponent(a.id)}`))}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini" data-action="edit-akce" data-id="${a.id}">✎ Upravit</button>
          <button class="btn-mini btn-mini-danger" data-action="delete-akce" data-id="${a.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  akceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const submitBtn = f.querySelector(".btn-submit");
    submitBtn.disabled = true;
    const bullets = f.bullets.value.split("\n").map((s) => s.trim()).filter(Boolean);
    let finalPhoto = null;
    const ok = await trySave(async () => {
      finalPhoto = await akcePhoto.commit("akce");
      const patch = {
        tag: f.tag.value.trim() || "AKCE",
        color: f.color.value,
        category: f.category.value,
        title: f.title.value.trim(),
        date: f.date.value.trim(),
        location: f.location.value.trim(),
        description: f.description.value.trim(),
        bullets,
        featured: f.featured.checked,
        age: f.age.value.trim() || null,
        ...readHero(f),
        photo: finalPhoto,
      };
      if (editingAkceId) {
        await VTStore.akce.update(editingAkceId, patch);
      } else {
        await VTStore.akce.add(patch);
      }
    });
    submitBtn.disabled = false;
    if (!ok) return;
    akcePhoto.cleanup(finalPhoto);
    resetAkceForm();
    renderAkce();
    updateCounts();
  });

  akceForm.querySelector("[data-cancel-edit]").addEventListener("click", resetAkceForm);

  document.getElementById("akce-list").addEventListener("click", async (e) => {
    const editBtn = e.target.closest("button[data-action='edit-akce']");
    if (editBtn) {
      startEditAkce(editBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest("button[data-action='delete-akce']");
    if (delBtn) {
      if (confirm("Smazat tuto akci?")) {
        const id = delBtn.dataset.id;
        const photo = (VTStore.akce.get(id) || {}).photo;
        const ok = await trySave(() => VTStore.akce.remove(id));
        if (!ok) return;
        VTStore.deletePhoto(photo);
        if (editingAkceId === id) resetAkceForm();
        renderAkce();
        updateCounts();
      }
    }
  });

  // ------------------------------------------------------------- společné --
  // Hierarchie obsahu: aktivita (VTStore.krouzky) -> kurz (VTStore.skupiny,
  // activityId) -> termín (VTStore.rozvrhSkupin, groupId). Rozvrh na webu se
  // z termínů skládá sám (VTStore.timetable), v adminu je jen náhled.
  const DAY_NAMES = { 1: "Pondělí", 2: "Úterý", 3: "Středa", 4: "Čtvrtek", 5: "Pátek", 6: "Sobota", 7: "Neděle" };
  const DAY_SHORT = { 1: "Po", 2: "Út", 3: "St", 4: "Čt", 5: "Pá", 6: "So", 7: "Ne" };
  const PROGRAM_ORDER = ["volnocas", "zumba", "vfresh"];
  const PROGRAM_NAMES = { volnocas: "Aktivity SK Viktoria", zumba: "Zumba & Dance", vfresh: "VFRESH DC" };
  const PROGRAM_TAGS = { volnocas: "tag-teal", zumba: "tag-red", vfresh: "tag-purple" };

  // "8:15" -> "08:15" (čas se ukládá i porovnává jako dvouciferný "HH:MM")
  function padTime(t) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ""));
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
  }

  // Rozbalovací seznam časů po 15 minutách (6:00–22:00), aby nevznikaly překlepy.
  function timeSelectOptions(emptyLabel) {
    const opts = [];
    if (emptyLabel) opts.push(`<option value="">${escapeHtml(emptyLabel)}</option>`);
    for (let m = 6 * 60; m <= 22 * 60; m += 15) {
      const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      opts.push(`<option value="${t}">${t}</option>`);
    }
    return opts.join("");
  }

  function slugify(str) {
    return String(str || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function uniqueSlug(base, taken) {
    const root = slugify(base) || "polozka";
    let slug = root;
    for (let i = 2; taken.includes(slug); i++) slug = `${root}-${i}`;
    return slug;
  }

  function programOf(a) {
    if (a && PROGRAM_NAMES[a.program]) return a.program;
    return a && a.group === "vfresh" ? "vfresh" : "volnocas";
  }
  function sortedActivities() {
    return VTStore.krouzky.all().slice().sort((a, b) =>
      (PROGRAM_ORDER.indexOf(programOf(a)) - PROGRAM_ORDER.indexOf(programOf(b))) ||
      String(a.name).localeCompare(String(b.name), "cs"));
  }
  function placeName(id, short) {
    const p = id ? VTStore.mista.get(id) : null;
    if (!p) return "";
    return short ? (p.shortName || p.name) : p.name;
  }
  function slotText(s) {
    const time = s.endTime ? `${s.startTime}–${s.endTime}` : s.startTime;
    const place = placeName(s.placeId, true);
    return `${DAY_SHORT[s.weekday] || ""} ${time}${place ? " · " + place : ""}${s.note ? " (" + s.note + ")" : ""}`;
  }
  function priceText(g) {
    return g.priceCzk ? `${Number(g.priceCzk).toLocaleString("cs-CZ")} Kč${g.priceNote ? " · " + g.priceNote : ""}` : "";
  }

  function switchTab(name) {
    const tab = tabs.find((t) => t.dataset.tab === name);
    if (tab) tab.click();
  }

  // ------------------------------------------------------------- aktivity --
  const krouzekForm = document.getElementById("form-krouzek");
  const krouzekPhoto = setupPhotoField(krouzekForm, "krouzek-photo-row", "krouzek-photo-preview");
  const iconSelect = document.getElementById("krouzek-icon-select");
  const iconPreview = document.getElementById("krouzek-icon-preview");
  const detailPhotosBox = document.getElementById("krouzek-detail-photos");
  let editingKrouzekId = null;
  // Fotky stránky aktivity: { url, alt } z databáze nebo { blob, preview } nově vybrané.
  let detailPhotos = [];
  let detailPhotosOriginal = [];

  Object.keys(window.VT_ICONS || {}).forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = VT_ICONS[key].label;
    iconSelect.appendChild(opt);
  });
  function refreshIconPreview() {
    iconPreview.innerHTML = window.vtIconSvg ? window.vtIconSvg(iconSelect.value) : "";
  }
  iconSelect.addEventListener("change", refreshIconPreview);
  refreshIconPreview();

  function renderDetailPhotos() {
    detailPhotosBox.innerHTML = detailPhotos.map((p, i) => `
      <div class="admin-photo-thumb">
        <img src="${escapeHtml(p.blob ? p.preview : pub(p.url))}" alt="">
        <button type="button" class="btn-mini btn-mini-danger" data-remove-detail-photo="${i}" aria-label="Odebrat fotku">🗑</button>
      </div>`).join("");
  }
  krouzekForm.detailPhotoFiles.addEventListener("change", async () => {
    const files = [...(krouzekForm.detailPhotoFiles.files || [])];
    for (const file of files) {
      try {
        const blob = await compressImage(file, 1600, 0.82);
        detailPhotos.push({ blob, preview: URL.createObjectURL(blob) });
      } catch (e) {
        alert(`Fotku ${file.name} se nepodařilo zpracovat.`);
      }
    }
    krouzekForm.detailPhotoFiles.value = "";
    renderDetailPhotos();
  });
  detailPhotosBox.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-detail-photo]");
    if (!btn) return;
    const [removed] = detailPhotos.splice(Number(btn.dataset.removeDetailPhoto), 1);
    if (removed && removed.blob) URL.revokeObjectURL(removed.preview);
    renderDetailPhotos();
  });
  function setDetailPhotos(list) {
    detailPhotos.forEach((p) => p.blob && URL.revokeObjectURL(p.preview));
    detailPhotos = (Array.isArray(list) ? list : []).filter((p) => p && p.url).map((p) => ({ url: p.url, alt: p.alt || "" }));
    detailPhotosOriginal = detailPhotos.map((p) => p.url);
    renderDetailPhotos();
  }

  function resetKrouzekForm() {
    editingKrouzekId = null;
    krouzekForm.reset();
    krouzekPhoto.set(null);
    setDetailPhotos([]);
    iconSelect.value = "star";
    refreshIconPreview();
    document.getElementById("form-krouzek-title").textContent = "Přidat aktivitu";
    krouzekForm.querySelector(".btn-submit").textContent = "Přidat aktivitu";
    krouzekForm.querySelector("[data-cancel-edit]").hidden = true;
    krouzekForm.classList.remove("is-editing");
  }

  function startEditKrouzek(id) {
    const item = VTStore.krouzky.get(id);
    if (!item) return;
    editingKrouzekId = id;
    iconSelect.value = item.icon || "star";
    refreshIconPreview();
    krouzekForm.program.value = programOf(item);
    krouzekForm.name.value = item.name || "";
    krouzekForm.age.value = item.age || "";
    krouzekForm.location.value = item.location || "";
    krouzekForm.when.value = item.when || "";
    krouzekForm.description.value = item.description || "";
    krouzekForm.detailLead.value = item.detailLead || "";
    krouzekForm.badge.value = item.badge || "";
    krouzekForm.featured.checked = !!item.featured;
    fillHero(krouzekForm, item);
    krouzekPhoto.set(item.photo || null);
    setDetailPhotos(item.detailPhotos);
    document.getElementById("form-krouzek-title").textContent = "Upravit aktivitu";
    krouzekForm.querySelector(".btn-submit").textContent = "Uložit změny";
    krouzekForm.querySelector("[data-cancel-edit]").hidden = false;
    krouzekForm.classList.add("is-editing");
    krouzekForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function courseLineHtml(g) {
    const slots = VTStore.slotsOf(g.id);
    const bits = [
      g.ageLabel,
      slots.length ? slots.map(slotText).join(", ") : "⚠ bez termínu",
      priceText(g),
    ].filter(Boolean);
    return `<li class="${g.published === false ? "is-unpublished" : ""}"><button type="button" class="link-btn" data-action="open-skupina" data-id="${g.id}">${escapeHtml(g.name)}</button>${g.published === false ? ' <span class="seed-badge">skryto</span>' : ""}<span> · ${escapeHtml(bits.join(" · "))}</span></li>`;
  }

  function renderKrouzky() {
    const list = document.getElementById("krouzky-list");
    const empty = document.getElementById("krouzky-empty");
    const items = sortedActivities();
    empty.hidden = items.length > 0;
    list.innerHTML = PROGRAM_ORDER.map((prog) => {
      const rows = items.filter((k) => programOf(k) === prog);
      if (!rows.length) return "";
      return `<h3 class="admin-subhead">${escapeHtml(PROGRAM_NAMES[prog])}</h3>` + rows.map((k) => {
        const courses = VTStore.coursesOf(k.id);
        const when = VTStore.whenLabel(k);
        return `
      <div class="admin-card" data-id="${k.id}">
        <div class="admin-card-main">
          ${k.photo ? `<img class="admin-card-thumb" src="${escapeHtml(pub(k.photo))}" alt="">` : `<span class="admin-card-thumb icon-preview" style="display:flex;align-items:center;justify-content:center">${window.vtIconSvg ? window.vtIconSvg(k.icon) : ""}</span>`}
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(k.name)} <span class="tag ${PROGRAM_TAGS[prog]}">${escapeHtml(k.age || "Novinka")}</span>${k.badge ? ` <span class="seed-badge">${escapeHtml(k.badge)}</span>` : ""}</div>
            <div class="admin-card-meta">${escapeHtml([k.location, when].filter(Boolean).join(" · "))}${k.featured ? " · na hlavní straně" : ""}${heroMeta(k)}</div>
            <p class="admin-card-message">${escapeHtml(k.description || "")}</p>
            <div class="admin-course-list">
              <div class="admin-course-list-head">Kurzy (${courses.length})</div>
              ${courses.length ? `<ul>${courses.map(courseLineHtml).join("")}</ul>` : '<p class="admin-warn">Zatím žádný kurz, na webu se nezobrazí rozvrh ani cena.</p>'}
            </div>
          </div>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="${escapeHtml(pub(VTStore.hrefFor(k, VTStore.activityHref(k))))}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini" data-action="edit-krouzek" data-id="${k.id}">✎ Upravit</button>
          <button class="btn-mini" data-action="add-kurz" data-id="${k.id}">＋ Kurz</button>
          <button class="btn-mini btn-mini-danger" data-action="delete-krouzek" data-id="${k.id}">🗑 Smazat</button>
        </div>
      </div>`;
      }).join("");
    }).join("");
  }

  krouzekForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const submitBtn = f.querySelector(".btn-submit");
    submitBtn.disabled = true;
    let finalPhoto = null;
    let finalDetailPhotos = [];
    const program = f.program.value;
    const name = f.name.value.trim();
    const ok = await trySave(async () => {
      finalPhoto = await krouzekPhoto.commit("krouzky");
      finalDetailPhotos = [];
      for (const p of detailPhotos) {
        if (p.blob) {
          const url = await VTStore.uploadPhoto(p.blob, "krouzky");
          URL.revokeObjectURL(p.preview);
          Object.assign(p, { url, alt: "", blob: null, preview: null });
        }
        finalDetailPhotos.push({ url: p.url, alt: p.alt || `${name} (foto)` });
      }
      const patch = {
        icon: iconSelect.value,
        program,
        // group a site se odvozují z kategorie: VFRESH DC je taneční web (na hlavním
        // webu jen jako rozcestník, site both), ostatní patří na hlavní web.
        group: program === "vfresh" ? "vfresh" : "volnocas",
        site: program === "vfresh" ? "both" : "viktoria",
        name,
        age: f.age.value.trim() || "Novinka",
        location: f.location.value.trim(),
        when: f.when.value.trim() || null,
        description: f.description.value.trim(),
        detailLead: f.detailLead.value.trim() || null,
        badge: f.badge.value.trim() || null,
        detailPhotos: finalDetailPhotos,
        featured: f.featured.checked,
        ...readHero(f),
        photo: finalPhoto,
      };
      if (editingKrouzekId) {
        const current = VTStore.krouzky.get(editingKrouzekId);
        // slug (adresa stránky) se při úpravě nemění, aby fungovaly sdílené odkazy
        if (current && !current.slug) patch.slug = uniqueSlug(name, VTStore.krouzky.all().map((k) => k.slug));
        await VTStore.krouzky.update(editingKrouzekId, patch);
      } else {
        patch.slug = uniqueSlug(name, VTStore.krouzky.all().map((k) => k.slug));
        await VTStore.krouzky.add({ ...patch, color: "teal", schedule: [] });
      }
    });
    submitBtn.disabled = false;
    if (!ok) return;
    krouzekPhoto.cleanup(finalPhoto);
    const kept = finalDetailPhotos.map((p) => p.url);
    detailPhotosOriginal.filter((url) => !kept.includes(url)).forEach((url) => VTStore.deletePhoto(url));
    resetKrouzekForm();
    renderCourseStuff();
  });

  krouzekForm.querySelector("[data-cancel-edit]").addEventListener("click", resetKrouzekForm);

  document.getElementById("krouzky-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "edit-krouzek") {
      startEditKrouzek(id);
    } else if (action === "add-kurz") {
      switchTab("skupiny");
      resetSkupinaForm(id);
      skupinaForm.scrollIntoView({ behavior: "smooth", block: "start" });
      skupinaForm.name.focus({ preventScroll: true });
    } else if (action === "open-skupina") {
      switchTab("skupiny");
      startEditSkupina(id);
    } else if (action === "delete-krouzek") {
      const item = VTStore.krouzky.get(id);
      if (!item) return;
      const courses = VTStore.coursesOf(id);
      const msg = courses.length
        ? `Smazat aktivitu „${item.name}“ i s ${courses.length} kurzy a jejich termíny? Tohle nejde vrátit.`
        : `Smazat aktivitu „${item.name}“?`;
      if (!confirm(msg)) return;
      const ok = await trySave(async () => {
        for (const g of courses) await removeCourse(g.id);
        await VTStore.krouzky.remove(id);
      });
      if (!ok) { renderCourseStuff(); return; }
      VTStore.deletePhoto(item.photo);
      (item.detailPhotos || []).forEach((p) => VTStore.deletePhoto(p && p.url));
      if (editingKrouzekId === id) resetKrouzekForm();
      renderCourseStuff();
    }
  });

  // ---------------------------------------------------------------- kurzy --
  const skupinaForm = document.getElementById("form-skupina");
  const activitySelect = document.getElementById("skupina-activity-select");
  const slotRowsBox = document.getElementById("skupina-slots");
  let editingSkupinaId = null;
  let editingSlotIds = [];

  function refreshActivitySelect() {
    const current = activitySelect.value;
    const acts = sortedActivities();
    activitySelect.innerHTML = '<option value="">Vyberte aktivitu…</option>' + PROGRAM_ORDER.map((prog) => {
      const rows = acts.filter((a) => programOf(a) === prog);
      if (!rows.length) return "";
      return `<optgroup label="${escapeHtml(PROGRAM_NAMES[prog])}">${rows.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("")}</optgroup>`;
    }).join("");
    if (acts.some((a) => a.id === current)) activitySelect.value = current;
  }

  function placeOptions() {
    return '<option value="">Bez místa</option>' + VTStore.mista.all().map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
  }
  const WEEKDAY_OPTIONS = Object.keys(DAY_NAMES).map((d) => `<option value="${d}">${DAY_NAMES[d]}</option>`).join("");

  function addSlotRow(slot) {
    const row = document.createElement("div");
    row.className = "slot-row";
    if (slot && slot.id) row.dataset.id = slot.id;
    row.innerHTML = `
      <select name="slotWeekday" aria-label="Den">${WEEKDAY_OPTIONS}</select>
      <select name="slotStart" aria-label="Od">${timeSelectOptions()}</select>
      <select name="slotEnd" aria-label="Do">${timeSelectOptions("do –")}</select>
      <select name="slotPlace" aria-label="Místo">${placeOptions()}</select>
      <input type="text" name="slotNote" placeholder="Poznámka" maxlength="80" aria-label="Poznámka">
      <button type="button" class="btn-mini btn-mini-danger" data-remove-slot aria-label="Odebrat termín">✕</button>`;
    const last = slotRowsBox.querySelector(".slot-row:last-child");
    row.querySelector('[name="slotWeekday"]').value = String(slot ? slot.weekday : (last ? last.querySelector('[name="slotWeekday"]').value : 1));
    row.querySelector('[name="slotStart"]').value = slot ? padTime(slot.startTime) : "16:00";
    row.querySelector('[name="slotEnd"]').value = slot && slot.endTime ? padTime(slot.endTime) : (slot ? "" : "17:00");
    const defaultPlace = last ? last.querySelector('[name="slotPlace"]').value : ((VTStore.mista.all().find((p) => p.slug === "cut") || {}).id || "");
    row.querySelector('[name="slotPlace"]').value = slot ? (slot.placeId || "") : defaultPlace;
    row.querySelector('[name="slotNote"]').value = (slot && slot.note) || "";
    slotRowsBox.appendChild(row);
  }
  document.getElementById("skupina-add-slot").addEventListener("click", () => addSlotRow(null));
  slotRowsBox.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-slot]");
    if (btn) btn.closest(".slot-row").remove();
  });

  function readSlotRows() {
    return [...slotRowsBox.querySelectorAll(".slot-row")].map((row) => ({
      id: row.dataset.id || null,
      weekday: Number(row.querySelector('[name="slotWeekday"]').value),
      startTime: row.querySelector('[name="slotStart"]').value,
      endTime: row.querySelector('[name="slotEnd"]').value || null,
      placeId: row.querySelector('[name="slotPlace"]').value || null,
      note: row.querySelector('[name="slotNote"]').value.trim() || null,
    }));
  }

  function resetSkupinaForm(activityId) {
    editingSkupinaId = null;
    editingSlotIds = [];
    skupinaForm.reset();
    refreshActivitySelect();
    activitySelect.value = activityId || "";
    slotRowsBox.innerHTML = "";
    addSlotRow(null);
    document.getElementById("form-skupina-title").textContent = "Přidat kurz";
    skupinaForm.querySelector(".btn-submit").textContent = "Přidat kurz";
    skupinaForm.querySelector("[data-cancel-edit]").hidden = true;
    skupinaForm.classList.remove("is-editing");
  }

  function startEditSkupina(id, copy) {
    const item = VTStore.skupiny.get(id);
    if (!item) return;
    editingSkupinaId = copy ? null : id;
    refreshActivitySelect();
    activitySelect.value = item.activityId || "";
    skupinaForm.name.value = copy ? `${item.name} (kopie)` : (item.name || "");
    skupinaForm.shortName.value = item.shortName || "";
    skupinaForm.ageLabel.value = item.ageLabel || "";
    skupinaForm.description.value = item.description || "";
    skupinaForm.priceCzk.value = item.priceCzk ?? "";
    skupinaForm.priceNote.value = item.priceNote || "";
    skupinaForm.priceExtra.value = Array.isArray(item.priceExtra)
      ? item.priceExtra.map((row) => `${row.label || ""} | ${row.value || ""}`).join("\n")
      : "";
    skupinaForm.termNote.value = item.termNote || "";
    skupinaForm.trialLesson.checked = !!item.trialLesson;
    skupinaForm.trialNote.value = item.trialNote || "";
    skupinaForm.sortOrder.value = item.sortOrder ?? 100;
    skupinaForm.published.checked = item.published !== false;
    slotRowsBox.innerHTML = "";
    const slots = VTStore.slotsOf(id);
    editingSlotIds = copy ? [] : slots.map((s) => s.id);
    slots.forEach((s) => addSlotRow(copy ? { ...s, id: null } : s));
    if (!slots.length) addSlotRow(null);
    document.getElementById("form-skupina-title").textContent = copy ? "Přidat kurz (kopie)" : "Upravit kurz";
    skupinaForm.querySelector(".btn-submit").textContent = copy ? "Přidat kurz" : "Uložit změny";
    skupinaForm.querySelector("[data-cancel-edit]").hidden = false;
    skupinaForm.classList.toggle("is-editing", !copy);
    skupinaForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Smaže kurz i s jeho termíny (nejdřív termíny, ať sedí i kopie v prohlížeči).
  async function removeCourse(id) {
    for (const s of VTStore.slotsOf(id)) await VTStore.rozvrhSkupin.remove(s.id);
    await VTStore.skupiny.remove(id);
  }

  function renderSkupiny() {
    const list = document.getElementById("skupiny-list");
    const empty = document.getElementById("skupiny-empty");
    const all = VTStore.skupiny.all();
    empty.hidden = all.length > 0;
    const acts = sortedActivities();
    const orphans = all.filter((g) => !g.activityId || !VTStore.krouzky.get(g.activityId));
    const sections = acts.map((a) => ({ title: a.name, prog: programOf(a), rows: VTStore.coursesOf(a.id) }))
      .filter((sec) => sec.rows.length);
    if (orphans.length) sections.push({ title: "Bez aktivity (na webu se nezobrazí)", prog: "volnocas", rows: orphans });
    list.innerHTML = sections.map((sec) => `
      <h3 class="admin-subhead">${escapeHtml(sec.title)} <span class="tag ${PROGRAM_TAGS[sec.prog]}">${escapeHtml(PROGRAM_NAMES[sec.prog])}</span></h3>
      ${sec.rows.map((g) => {
        const slots = VTStore.slotsOf(g.id);
        const meta = [priceText(g), g.trialLesson ? "zkušební lekce zdarma" : ""].filter(Boolean).join(" · ");
        return `
        <div class="admin-card${g.published === false ? " is-unpublished" : ""}" data-id="${g.id}" id="kurz-${g.id}">
          <div class="admin-card-main">
            <div class="admin-card-main-text">
              <div class="admin-card-title">${escapeHtml(g.name)}${g.ageLabel ? ` <span class="tag tag-teal">${escapeHtml(g.ageLabel)}</span>` : ""}${g.published === false ? ' <span class="seed-badge">skryto</span>' : ""}</div>
              <ul class="admin-slot-list">${slots.length ? slots.map((s) => `<li>${escapeHtml(slotText(s))}${s.published === false ? " (skryto)" : ""}</li>`).join("") : '<li class="admin-warn">Bez termínu, v rozvrhu se neobjeví.</li>'}</ul>
              ${meta ? `<div class="admin-card-meta">${escapeHtml(meta)}</div>` : ""}
            </div>
          </div>
          <div class="admin-card-actions">
            <button class="btn-mini" data-action="edit-skupina" data-id="${g.id}">✎ Upravit</button>
            <button class="btn-mini" data-action="copy-skupina" data-id="${g.id}">⧉ Kopie</button>
            <button class="btn-mini" data-action="toggle-skupina" data-id="${g.id}">${g.published === false ? "Zobrazit" : "Skrýt"}</button>
            <button class="btn-mini btn-mini-danger" data-action="delete-skupina" data-id="${g.id}">🗑 Smazat</button>
          </div>
        </div>`;
      }).join("")}
    `).join("");
  }

  skupinaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const activity = VTStore.krouzky.get(f.activityId.value);
    if (!activity) { alert("Vyberte aktivitu, pod kterou kurz patří."); return; }
    const slots = readSlotRows();
    const bad = slots.find((s) => s.endTime && padTime(s.endTime) <= padTime(s.startTime));
    if (bad) { alert(`Termín ${DAY_NAMES[bad.weekday]} ${bad.startTime}: konec musí být po začátku.`); return; }
    const submitBtn = f.querySelector(".btn-submit");
    submitBtn.disabled = true;
    const priceExtra = f.priceExtra.value.split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
      const [label, value] = line.split("|").map((s) => (s || "").trim());
      return { label: label || "", value: value || "" };
    });
    const ok = await trySave(async () => {
      const patch = {
        activityId: activity.id,
        name: f.name.value.trim(),
        shortName: f.shortName.value.trim() || null,
        ageLabel: f.ageLabel.value.trim() || null,
        description: f.description.value.trim() || null,
        priceCzk: f.priceCzk.value !== "" ? Number(f.priceCzk.value) : null,
        priceNote: f.priceNote.value.trim() || null,
        priceExtra,
        termNote: f.termNote.value.trim() || null,
        trialLesson: f.trialLesson.checked,
        trialNote: f.trialNote.value.trim() || null,
        sortOrder: Number(f.sortOrder.value) || 100,
        published: f.published.checked,
      };
      let groupId = editingSkupinaId;
      if (groupId) {
        await VTStore.skupiny.update(groupId, patch);
      } else {
        patch.slug = uniqueSlug(`${activity.slug || "kurz"}-${patch.name}`, VTStore.skupiny.all().map((g) => g.slug));
        groupId = (await VTStore.skupiny.add(patch)).id;
      }
      // Termíny: upravit existující, přidat nové, smazat odebrané.
      const keep = new Set();
      for (const s of slots) {
        const row = { weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, placeId: s.placeId, note: s.note };
        if (s.id) {
          keep.add(s.id);
          await VTStore.rozvrhSkupin.update(s.id, row);
        } else {
          await VTStore.rozvrhSkupin.add({ ...row, groupId, published: true });
        }
      }
      for (const id of editingSlotIds) {
        if (!keep.has(id)) await VTStore.rozvrhSkupin.remove(id);
      }
    });
    submitBtn.disabled = false;
    renderCourseStuff();
    if (!ok) return;
    resetSkupinaForm(activity.id);
  });

  skupinaForm.querySelector("[data-cancel-edit]").addEventListener("click", () => resetSkupinaForm(activitySelect.value));

  document.getElementById("skupiny-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "edit-skupina") {
      startEditSkupina(id, false);
    } else if (action === "copy-skupina") {
      startEditSkupina(id, true);
    } else if (action === "toggle-skupina") {
      const g = VTStore.skupiny.get(id);
      if (!g) return;
      const ok = await trySave(() => VTStore.skupiny.update(id, { published: g.published === false }));
      if (ok) renderCourseStuff();
    } else if (action === "delete-skupina") {
      const g = VTStore.skupiny.get(id);
      if (!g || !confirm(`Smazat kurz „${g.name}“ i s jeho termíny?`)) return;
      const ok = await trySave(() => removeCourse(id));
      if (editingSkupinaId === id) resetSkupinaForm(g.activityId);
      renderCourseStuff();
      if (!ok) return;
    }
  });

  // ---------------------------------------------------------------- místa --
  const mistoForm = document.getElementById("form-misto");
  let editingMistoId = null;

  function resetMistoForm() {
    editingMistoId = null;
    mistoForm.reset();
    document.getElementById("form-misto-title").textContent = "Přidat místo";
    mistoForm.querySelector(".btn-submit").textContent = "Přidat místo";
    mistoForm.querySelector("[data-cancel-edit]").hidden = true;
    mistoForm.classList.remove("is-editing");
  }

  function renderMista() {
    const used = new Map();
    VTStore.rozvrhSkupin.all().forEach((s) => { if (s.placeId) used.set(s.placeId, (used.get(s.placeId) || 0) + 1); });
    document.getElementById("mista-list").innerHTML = VTStore.mista.all().map((p) => `
      <div class="admin-card" data-id="${p.id}">
        <div class="admin-card-main"><div class="admin-card-main-text">
          <div class="admin-card-title">${escapeHtml(p.name)}${p.shortName && p.shortName !== p.name ? ` <span class="tag">${escapeHtml(p.shortName)}</span>` : ""}</div>
          <div class="admin-card-meta">${escapeHtml([p.address, p.note].filter(Boolean).join(" · "))}${p.address || p.note ? " · " : ""}${used.get(p.id) || 0} termínů</div>
        </div></div>
        <div class="admin-card-actions">
          <button class="btn-mini" data-action="edit-misto" data-id="${p.id}">✎ Upravit</button>
          <button class="btn-mini btn-mini-danger" data-action="delete-misto" data-id="${p.id}">🗑 Smazat</button>
        </div>
      </div>`).join("");
  }

  mistoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const patch = {
      name: f.name.value.trim(),
      shortName: f.shortName.value.trim() || null,
      address: f.address.value.trim() || null,
      note: f.note.value.trim() || null,
    };
    const ok = await trySave(async () => {
      if (editingMistoId) {
        await VTStore.mista.update(editingMistoId, patch);
      } else {
        const maxOrder = Math.max(0, ...VTStore.mista.all().map((p) => p.sortOrder || 0));
        await VTStore.mista.add({ ...patch, slug: uniqueSlug(patch.name, VTStore.mista.all().map((p) => p.slug)), sortOrder: maxOrder + 10, published: true });
      }
    });
    if (!ok) return;
    resetMistoForm();
    renderCourseStuff();
  });
  mistoForm.querySelector("[data-cancel-edit]").addEventListener("click", resetMistoForm);

  document.getElementById("mista-list").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const p = VTStore.mista.get(btn.dataset.id);
    if (!p) return;
    if (btn.dataset.action === "edit-misto") {
      editingMistoId = p.id;
      mistoForm.name.value = p.name || "";
      mistoForm.shortName.value = p.shortName || "";
      mistoForm.address.value = p.address || "";
      mistoForm.note.value = p.note || "";
      document.getElementById("form-misto-title").textContent = "Upravit místo";
      mistoForm.querySelector(".btn-submit").textContent = "Uložit změny";
      mistoForm.querySelector("[data-cancel-edit]").hidden = false;
      mistoForm.classList.add("is-editing");
      mistoForm.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (btn.dataset.action === "delete-misto") {
      const count = VTStore.rozvrhSkupin.all().filter((s) => s.placeId === p.id).length;
      if (count) { alert(`Místo „${p.name}“ používá ${count} termínů. Nejdřív u nich vyberte jiné místo.`); return; }
      if (!confirm(`Smazat místo „${p.name}“?`)) return;
      const ok = await trySave(() => VTStore.mista.remove(p.id));
      if (ok) { if (editingMistoId === p.id) resetMistoForm(); renderCourseStuff(); }
    }
  });

  // ------------------------------------------------------- rozvrh (náhled) --
  let rozvrhSite = "viktoria";
  document.getElementById("rozvrh-site-filter").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-site]");
    if (!btn) return;
    rozvrhSite = btn.dataset.site;
    document.querySelectorAll("#rozvrh-site-filter [data-site]").forEach((b) => b.classList.toggle("active", b === btn));
    renderRozvrh();
  });

  function renderRozvrh() {
    const week = document.getElementById("rozvrh-week");
    const rows = VTStore.timetable({ site: rozvrhSite });
    const days = rows.some((r) => r.weekday > 5) ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
    week.style.setProperty("--tt-cols", days.length);
    week.innerHTML = days.map((d) => {
      const list = rows.filter((r) => r.weekday === d);
      return `<div class="tt-day"><h3 class="tt-dayname">${DAY_NAMES[d]}</h3><ul class="tt-slots">${list.length ? list.map((r) => `
        <li><button type="button" class="tt-slot tt-${r.program}" data-group="${r.groupId}" title="Upravit kurz">
          <time>${escapeHtml(r.endTime ? `${r.time}–${r.endTime}` : r.time)}</time>
          <span class="tt-name">${escapeHtml(r.name)}</span>
          ${r.note ? `<span class="tt-note">${escapeHtml(r.note)}</span>` : ""}
        </button></li>`).join("") : '<li class="tt-empty">Žádná lekce</li>'}</ul></div>`;
    }).join("");

    // Upozornění: co se v rozvrhu tohoto webu neukáže, i když by možná mělo.
    const acts = VTStore.krouzky.all().filter((a) => (a.site || "viktoria") === rozvrhSite || a.site === "both");
    const warnings = [];
    acts.forEach((a) => {
      const courses = VTStore.coursesOf(a.id, true);
      if (!courses.length) warnings.push(`<li>Aktivita <b>${escapeHtml(a.name)}</b> nemá žádný zveřejněný kurz.</li>`);
      courses.forEach((g) => {
        if (!VTStore.slotsOf(g.id, true).length) warnings.push(`<li>Kurz <button type="button" class="link-btn" data-group="${g.id}">${escapeHtml(g.name)}</button> (${escapeHtml(a.name)}) nemá termín.</li>`);
      });
    });
    const warn = document.getElementById("rozvrh-warn");
    warn.hidden = !warnings.length;
    warn.innerHTML = warnings.length ? `<h3 class="admin-subhead">Chybí v rozvrhu</h3><ul>${warnings.join("")}</ul>` : "";
  }

  document.getElementById("panel-rozvrh").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-group]");
    if (!btn) return;
    switchTab("skupiny");
    startEditSkupina(btn.dataset.group);
  });

  // Aktivity, kurzy, místa i rozvrh na sobě závisí: po každé změně překreslit vše.
  function renderCourseStuff() {
    renderKrouzky();
    refreshActivitySelect();
    renderSkupiny();
    renderMista();
    renderRozvrh();
    updateCounts();
  }

  // -------------------------------------------------------------- galerie --
  // Galerie sdílí tabulku mezi oběma weby (sloupec site), takže je nutné je
  // v adminu jasně oddělit: filtr nahoře, barevný štítek na kartě a řazení/
  // mazání smí sáhnout jen na fotky aktuálně zvoleného webu.
  const galerieForm = document.getElementById("form-galerie-upload");
  const galerieList = document.getElementById("galerie-list");
  const galerieProgress = document.getElementById("galerie-progress");
  const galerieUploadSite = document.getElementById("galerie-upload-site");
  const SITE_NAMES = { viktoria: "SK Viktoria", vfresh: "VFRESH DC" };
  let galerieFilter = "viktoria";

  function galerieVisible() {
    const all = VTStore.galerie.all();
    return galerieFilter === "all" ? all : all.filter((g) => (g.site || "viktoria") === galerieFilter);
  }

  document.querySelectorAll("#galerie-filters .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.site === galerieFilter);
    btn.addEventListener("click", () => {
      document.querySelectorAll("#galerie-filters .filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      galerieFilter = btn.dataset.site;
      if (galerieFilter !== "all") galerieUploadSite.value = galerieFilter;
      renderGalerie();
    });
  });

  function renderGalerie() {
    const empty = document.getElementById("galerie-empty");
    const items = galerieVisible();
    empty.hidden = items.length > 0;
    galerieList.innerHTML = items.map((g, i) => {
      const site = g.site || "viktoria";
      return `
      <div class="gallery-admin-card${g.published ? "" : " is-unpublished"}" data-id="${g.id}">
        <img src="${escapeHtml(pub(g.photo))}" alt="${escapeHtml(g.caption || "")}" loading="lazy">
        <div class="gallery-admin-body">
          <input class="gallery-caption" type="text" value="${escapeHtml(g.caption || "")}" placeholder="Popisek fotky" maxlength="200" aria-label="Popisek fotky" data-id="${g.id}">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="site-badge site-badge-${site}">${escapeHtml(SITE_NAMES[site] || site)}</span>
            ${g.seed ? '<span class="seed-badge">základní</span>' : ""}
          </div>
          <div class="gallery-admin-actions">
            <button class="btn-mini" data-action="move-left" data-id="${g.id}" title="Posunout dopředu" aria-label="Posunout dopředu"${i === 0 ? " disabled" : ""}>←</button>
            <button class="btn-mini" data-action="move-right" data-id="${g.id}" title="Posunout dozadu" aria-label="Posunout dozadu"${i === items.length - 1 ? " disabled" : ""}>→</button>
            <button class="btn-mini" data-action="toggle-galerie" data-id="${g.id}">${g.published ? "Skrýt" : "Zobrazit"}</button>
            <button class="btn-mini btn-mini-danger" data-action="delete-galerie" data-id="${g.id}" aria-label="Smazat fotku">🗑</button>
          </div>
        </div>
      </div>
    `;
    }).join("");
  }

  galerieForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = [...galerieForm.photos.files];
    if (!files.length) return;
    const site = galerieUploadSite.value;
    const caption = galerieForm.caption.value.trim();
    const submitBtn = galerieForm.querySelector(".btn-submit");
    submitBtn.disabled = true;

    // Nové fotky jdou na začátek galerie DANÉHO webu, ve stejném pořadí, v jakém byly vybrány.
    const existing = VTStore.galerie.all().filter((g) => (g.site || "viktoria") === site).map((g) => g.sortOrder || 0);
    const first = (existing.length ? Math.min(...existing) : 10) - 10 * files.length;
    const failed = [];
    let done = 0;

    for (let i = 0; i < files.length; i++) {
      galerieProgress.textContent = `Nahrávám ${i + 1} z ${files.length}…`;
      let url = null;
      try {
        const blob = await compressImage(files[i], 1600, 0.82);
        url = await VTStore.uploadPhoto(blob, "galerie");
        await VTStore.galerie.add({ photo: url, caption: caption || null, sortOrder: first + 10 * i, published: true, site });
        done++;
        renderGalerie();
        updateCounts();
      } catch (err) {
        console.error(err);
        // Fotka se nahrála, ale řádek se neuložil: uklidíme ji z úložiště.
        if (url) VTStore.deletePhoto(url);
        failed.push({ name: files[i].name, err });
      }
    }

    submitBtn.disabled = false;
    galerieForm.reset();
    galerieUploadSite.value = site;
    if (failed.length) {
      galerieProgress.textContent = `Nahráno ${done} z ${files.length}.`;
      alert(`Nepodařilo se nahrát: ${failed.map((f) => f.name).join(", ")}.\n${friendlyError(failed[0].err)}`);
    } else {
      galerieProgress.textContent = done === 1 ? "Fotka je nahraná." : `Nahráno ${done} fotek.`;
    }
  });

  galerieList.addEventListener("change", async (e) => {
    const input = e.target.closest("input.gallery-caption");
    if (!input) return;
    const g = VTStore.galerie.get(input.dataset.id);
    if (!g) return;
    const value = input.value.trim();
    if (value === (g.caption || "")) return;
    const ok = await trySave(() => VTStore.galerie.update(g.id, { caption: value || null }));
    if (!ok) input.value = g.caption || "";
  });

  // Řazení šipkami smí prohazovat pořadí jen v rámci právě zobrazeného webu,
  // jinak by se sort_order omylem přepsal i fotkám druhého webu.
  async function moveGalerie(id, dir) {
    const items = galerieVisible();
    const i = items.findIndex((g) => g.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return;
    const a = items[i];
    const b = items[j];
    let orderA = b.sortOrder;
    let orderB = a.sortOrder;
    if (orderA === orderB) orderA += dir; // stejné pořadí: posun o jedničku
    const ok = await trySave(async () => {
      await VTStore.galerie.update(a.id, { sortOrder: orderA });
      await VTStore.galerie.update(b.id, { sortOrder: orderB });
    });
    if (ok) renderGalerie();
  }

  galerieList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn || btn.disabled) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "move-left") {
      await moveGalerie(id, -1);
    } else if (action === "move-right") {
      await moveGalerie(id, 1);
    } else if (action === "toggle-galerie") {
      const g = VTStore.galerie.get(id);
      if (!g) return;
      const ok = await trySave(() => VTStore.galerie.update(id, { published: !g.published }));
      if (ok) renderGalerie();
    } else if (action === "delete-galerie") {
      const g = VTStore.galerie.get(id);
      if (!confirm(`Smazat tuto fotku z galerie webu ${SITE_NAMES[(g && g.site) || "viktoria"]}?`)) return;
      const photo = (g || {}).photo;
      const ok = await trySave(() => VTStore.galerie.remove(id));
      if (!ok) return;
      VTStore.deletePhoto(photo);
      renderGalerie();
      updateCounts();
    }
  });

  // ----------------------------------------------------------------- misc --
  function renderAll() {
    renderSubmissions();
    renderAktuality();
    renderAkce();
    resetSkupinaForm();
    renderCourseStuff();
    renderGalerie();
    updateCounts();
  }

  // ---------------------------------------------------------- přihlášení --
  const loginSection = document.getElementById("admin-login");
  const loginForm = document.getElementById("form-login");
  const loginNote = document.getElementById("login-note");
  const mainSection = document.getElementById("admin-main");
  const loadingNote = document.getElementById("admin-loading");
  const logoutBtn = document.getElementById("admin-logout");
  const userLabel = document.getElementById("admin-user");

  function showLogin(message) {
    mainSection.hidden = true;
    loadingNote.hidden = true;
    logoutBtn.hidden = true;
    userLabel.hidden = true;
    loginSection.hidden = false;
    loginNote.textContent = message || "";
    loginForm.password.value = "";
  }

  async function start() {
    loginSection.hidden = true;
    loadingNote.hidden = false;
    await VTStore.loadAdmin();
    loadingNote.hidden = true;
    mainSection.hidden = false;
    const s = VTStore.auth.session();
    userLabel.textContent = s ? s.email : "";
    userLabel.hidden = !s;
    logoutBtn.hidden = false;
    renderAll();
  }

  // Ověří, že přihlášený uživatel je správce webu, a teprve pak načte data.
  async function enter() {
    try {
      if (!(await VTStore.auth.isAdmin())) {
        await VTStore.auth.signOut();
        showLogin("Tento účet nemá přístup do administrace.");
        return;
      }
      await start();
    } catch (e) {
      console.error(e);
      if (e && (e.status === 401 || e.status === 403)) {
        showLogin("Přihlášení vypršelo, přihlaste se prosím znovu.");
      } else {
        showLogin("Nepodařilo se spojit se serverem. Zkuste to prosím znovu.");
      }
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector(".btn-submit");
    btn.disabled = true;
    loginNote.textContent = "Přihlašuji…";
    try {
      await VTStore.auth.signIn(loginForm.email.value.trim(), loginForm.password.value);
    } catch (err) {
      btn.disabled = false;
      loginNote.textContent = err && err.status === 400
        ? "Nesprávný e-mail nebo heslo."
        : "Přihlášení se nepovedlo. Zkontrolujte připojení a zkuste to znovu.";
      return;
    }
    btn.disabled = false;
    await enter();
  });

  logoutBtn.addEventListener("click", async () => {
    await VTStore.auth.signOut();
    window.location.reload();
  });

  if (VTStore.auth.session()) {
    loadingNote.hidden = false;
    enter();
  } else {
    showLogin();
  }
})();

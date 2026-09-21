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
        preview.src = typeof current === "string" ? current : current.preview;
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
          ${a.photo ? `<img class="admin-card-thumb" src="${escapeHtml(a.photo)}" alt="">` : ""}
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(a.date)} ${a.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
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
      const patch = { date: f.date.value.trim(), text: f.text.value.trim(), photo: finalPhoto };
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
          ${a.photo ? `<img class="admin-card-thumb" src="${escapeHtml(a.photo)}" alt="">` : ""}
          <div class="admin-card-main-text">
            <div class="admin-card-title"><span class="tag tag-${a.color}">${escapeHtml(a.tag)}</span> ${escapeHtml(a.title)} ${a.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <div class="admin-card-meta">${escapeHtml(a.date)}${a.location ? " · " + escapeHtml(a.location) : ""}${a.featured ? " · na hlavní straně" : ""}</div>
            <p class="admin-card-message">${escapeHtml(a.description || "")}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="${a.detailHref || `akce-detail.html?id=${encodeURIComponent(a.id)}`}" target="_blank" rel="noopener">👁 Náhled</a>
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

  // -------------------------------------------------------------- kroužky --
  const krouzekForm = document.getElementById("form-krouzek");
  const krouzekPhoto = setupPhotoField(krouzekForm, "krouzek-photo-row", "krouzek-photo-preview");
  const iconSelect = document.getElementById("krouzek-icon-select");
  const iconPreview = document.getElementById("krouzek-icon-preview");
  let editingKrouzekId = null;

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

  function resetKrouzekForm() {
    editingKrouzekId = null;
    krouzekForm.reset();
    krouzekPhoto.set(null);
    iconSelect.value = "star";
    refreshIconPreview();
    document.getElementById("form-krouzek-title").textContent = "Přidat kroužek";
    krouzekForm.querySelector(".btn-submit").textContent = "Přidat kroužek";
    krouzekForm.querySelector("[data-cancel-edit]").hidden = true;
    krouzekForm.classList.remove("is-editing");
  }

  function startEditKrouzek(id) {
    const item = VTStore.krouzky.get(id);
    if (!item) return;
    editingKrouzekId = id;
    iconSelect.value = item.icon || "star";
    refreshIconPreview();
    krouzekForm.group.value = item.group || "volnocas";
    krouzekForm.name.value = item.name || "";
    krouzekForm.age.value = item.age || "";
    krouzekForm.location.value = item.location || "";
    krouzekForm.description.value = item.description || "";
    krouzekForm.schedule.value = Array.isArray(item.schedule)
      ? item.schedule.map((row) => `${row.label || ""} | ${row.time || ""}`).join("\n")
      : "";
    krouzekForm.featured.checked = !!item.featured;
    krouzekPhoto.set(item.photo || null);
    document.getElementById("form-krouzek-title").textContent = "Upravit kroužek";
    krouzekForm.querySelector(".btn-submit").textContent = "Uložit změny";
    krouzekForm.querySelector("[data-cancel-edit]").hidden = false;
    krouzekForm.classList.add("is-editing");
    krouzekForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderKrouzky() {
    const list = document.getElementById("krouzky-list");
    const empty = document.getElementById("krouzky-empty");
    const items = VTStore.krouzky.all();
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((k) => `
      <div class="admin-card" data-id="${k.id}">
        <div class="admin-card-main">
          ${k.photo ? `<img class="admin-card-thumb" src="${escapeHtml(k.photo)}" alt="">` : `<span class="admin-card-thumb icon-preview" style="display:flex;align-items:center;justify-content:center;background:#f4f1e9">${window.vtIconSvg ? window.vtIconSvg(k.icon) : ""}</span>`}
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(k.name)} <span class="tag tag-teal">${escapeHtml(k.age || "Novinka")}</span> ${k.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <div class="admin-card-meta">${escapeHtml(k.location || "")}${k.group === "vfresh" ? " · blok VFRESH DC" : " · blok Volnočasové aktivity"}${k.featured ? " · na hlavní straně" : ""}</div>
            <p class="admin-card-message">${escapeHtml(k.description || "")}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="${k.detailHref || `kurz-detail.html?id=${encodeURIComponent(k.id)}`}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini" data-action="edit-krouzek" data-id="${k.id}">✎ Upravit</button>
          <button class="btn-mini btn-mini-danger" data-action="delete-krouzek" data-id="${k.id}">🗑 Smazat</button>
        </div>
      </div>
    `).join("");
  }

  krouzekForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const submitBtn = f.querySelector(".btn-submit");
    submitBtn.disabled = true;
    const schedule = f.schedule.value.split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
      const [label, time] = line.split("|").map((s) => (s || "").trim());
      return { label: label || "", time: time || "" };
    });
    let finalPhoto = null;
    const ok = await trySave(async () => {
      finalPhoto = await krouzekPhoto.commit("krouzky");
      const patch = {
        icon: iconSelect.value,
        group: f.group.value,
        name: f.name.value.trim(),
        age: f.age.value.trim() || "Novinka",
        location: f.location.value.trim(),
        description: f.description.value.trim(),
        schedule,
        featured: f.featured.checked,
        photo: finalPhoto,
      };
      if (editingKrouzekId) {
        // barva karty se při úpravě nemění (formulář ji nenabízí)
        await VTStore.krouzky.update(editingKrouzekId, patch);
      } else {
        await VTStore.krouzky.add({ ...patch, color: "teal" });
      }
    });
    submitBtn.disabled = false;
    if (!ok) return;
    krouzekPhoto.cleanup(finalPhoto);
    resetKrouzekForm();
    renderKrouzky();
    updateCounts();
  });

  krouzekForm.querySelector("[data-cancel-edit]").addEventListener("click", resetKrouzekForm);

  document.getElementById("krouzky-list").addEventListener("click", async (e) => {
    const editBtn = e.target.closest("button[data-action='edit-krouzek']");
    if (editBtn) {
      startEditKrouzek(editBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest("button[data-action='delete-krouzek']");
    if (delBtn) {
      if (confirm("Smazat tento kroužek?")) {
        const id = delBtn.dataset.id;
        const photo = (VTStore.krouzky.get(id) || {}).photo;
        const ok = await trySave(() => VTStore.krouzky.remove(id));
        if (!ok) return;
        VTStore.deletePhoto(photo);
        if (editingKrouzekId === id) resetKrouzekForm();
        renderKrouzky();
        updateCounts();
      }
    }
  });

  // ----------------------------------------------------------------- misc --
  function renderAll() {
    renderSubmissions();
    renderAktuality();
    renderAkce();
    renderKrouzky();
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

(() => {
  "use strict";

  if (!window.VTStore) {
    document.querySelector(".admin-main").innerHTML =
      "<p class='admin-empty'>Administrace potřebuje localStorage, který se v tomto prohlížeči nepodařilo načíst.</p>";
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
  // Wires a <input type="file" name="photo"> to a preview thumbnail + a
  // "remove photo" button, and tracks the current value (an existing URL,
  // a freshly-picked data URL, or null) independent of the file input's
  // own value (which form.reset() clears but our tracked value shouldn't
  // always follow — editing an item keeps its photo until you change it).
  function setupPhotoField(form, rowId, previewId) {
    const fileInput = form.querySelector('input[name="photo"]');
    const row = document.getElementById(rowId);
    const preview = document.getElementById(previewId);
    let current = null;

    function show(url) {
      current = url || null;
      if (current) {
        preview.src = current;
        row.hidden = false;
      } else {
        preview.src = "";
        row.hidden = true;
      }
    }

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => show(reader.result);
      reader.readAsDataURL(file);
    });

    row.querySelector("[data-remove-photo]").addEventListener("click", () => {
      fileInput.value = "";
      show(null);
    });

    return {
      get: () => current,
      set: (url) => {
        fileInput.value = "";
        show(url);
      },
    };
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
          <div class="admin-card-title">${escapeHtml(s.name)} <span class="tag tag-teal">${escapeHtml(s.category)}</span></div>
          <div class="admin-card-meta">${escapeHtml(s.email)} · ${escapeHtml(fmtDate(s.createdAt))}</div>
          <p class="admin-card-message">${escapeHtml(s.message)}</p>
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

  document.getElementById("submissions-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "toggle-submission") {
      const s = VTStore.submissions.get(id);
      VTStore.submissions.update(id, { status: s.status === "done" ? "new" : "done" });
      renderSubmissions();
      updateCounts();
    } else if (btn.dataset.action === "delete-submission") {
      if (confirm("Smazat tuto přihlášku?")) {
        VTStore.submissions.remove(id);
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
          ${a.photo ? `<img class="admin-card-thumb" src="${a.photo}" alt="">` : ""}
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(a.date)} ${a.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <p class="admin-card-message">${escapeHtml(a.text)}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <button class="btn-mini" data-action="edit-aktualita" data-id="${a.id}">✎ Upravit</button>
          ${a.seed ? "" : `<button class="btn-mini btn-mini-danger" data-action="delete-aktualita" data-id="${a.id}">🗑 Smazat</button>`}
        </div>
      </div>
    `).join("");
  }

  aktualitaForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const patch = {
      date: f.date.value.trim(),
      text: f.text.value.trim(),
      photo: aktualitaPhoto.get(),
    };
    if (editingAktualitaId) {
      VTStore.aktuality.update(editingAktualitaId, patch);
    } else {
      VTStore.aktuality.add(patch);
    }
    resetAktualitaForm();
    renderAktuality();
    updateCounts();
  });

  aktualitaForm.querySelector("[data-cancel-edit]").addEventListener("click", resetAktualitaForm);

  document.getElementById("aktuality-list").addEventListener("click", (e) => {
    const editBtn = e.target.closest("button[data-action='edit-aktualita']");
    if (editBtn) {
      startEditAktualita(editBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest("button[data-action='delete-aktualita']");
    if (delBtn) {
      if (confirm("Smazat tuto aktualitu?")) {
        if (editingAktualitaId === delBtn.dataset.id) resetAktualitaForm();
        VTStore.aktuality.remove(delBtn.dataset.id);
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
          ${a.photo ? `<img class="admin-card-thumb" src="${a.photo}" alt="">` : ""}
          <div class="admin-card-main-text">
            <div class="admin-card-title"><span class="tag tag-${a.color}">${escapeHtml(a.tag)}</span> ${escapeHtml(a.title)} ${a.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <div class="admin-card-meta">${escapeHtml(a.date)}${a.location ? " · " + escapeHtml(a.location) : ""}${a.featured ? " · na hlavní straně" : ""}</div>
            <p class="admin-card-message">${escapeHtml(a.description || "")}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="${a.detailHref || `akce-detail.html?id=${encodeURIComponent(a.id)}`}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini" data-action="edit-akce" data-id="${a.id}">✎ Upravit</button>
          ${a.seed ? "" : `<button class="btn-mini btn-mini-danger" data-action="delete-akce" data-id="${a.id}">🗑 Smazat</button>`}
        </div>
      </div>
    `).join("");
  }

  akceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const bullets = f.bullets.value.split("\n").map((s) => s.trim()).filter(Boolean);
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
      photo: akcePhoto.get(),
    };
    if (editingAkceId) {
      VTStore.akce.update(editingAkceId, patch);
    } else {
      VTStore.akce.add(patch);
    }
    resetAkceForm();
    renderAkce();
    updateCounts();
  });

  akceForm.querySelector("[data-cancel-edit]").addEventListener("click", resetAkceForm);

  document.getElementById("akce-list").addEventListener("click", (e) => {
    const editBtn = e.target.closest("button[data-action='edit-akce']");
    if (editBtn) {
      startEditAkce(editBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest("button[data-action='delete-akce']");
    if (delBtn) {
      if (confirm("Smazat tuto akci?")) {
        if (editingAkceId === delBtn.dataset.id) resetAkceForm();
        VTStore.akce.remove(delBtn.dataset.id);
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
          ${k.photo ? `<img class="admin-card-thumb" src="${k.photo}" alt="">` : `<span class="admin-card-thumb icon-preview" style="display:flex;align-items:center;justify-content:center;background:#f4f1e9">${window.vtIconSvg ? window.vtIconSvg(k.icon) : ""}</span>`}
          <div class="admin-card-main-text">
            <div class="admin-card-title">${escapeHtml(k.name)} <span class="tag tag-teal">${escapeHtml(k.age || "Novinka")}</span> ${k.seed ? '<span class="seed-badge">základní</span>' : ""}</div>
            <div class="admin-card-meta">${escapeHtml(k.location || "")}${k.group === "vfresh" ? " · blok VFRESH DC" : " · blok Volnočasové aktivity"}${k.featured ? " · na hlavní straně" : ""}</div>
            <p class="admin-card-message">${escapeHtml(k.description || "")}</p>
          </div>
        </div>
        <div class="admin-card-actions">
          <a class="btn-mini" href="${k.detailHref || `kurz-detail.html?id=${encodeURIComponent(k.id)}`}" target="_blank" rel="noopener">👁 Náhled</a>
          <button class="btn-mini" data-action="edit-krouzek" data-id="${k.id}">✎ Upravit</button>
          ${k.seed ? "" : `<button class="btn-mini btn-mini-danger" data-action="delete-krouzek" data-id="${k.id}">🗑 Smazat</button>`}
        </div>
      </div>
    `).join("");
  }

  krouzekForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const schedule = f.schedule.value.split("\n").map((s) => s.trim()).filter(Boolean).map((line) => {
      const [label, time] = line.split("|").map((s) => (s || "").trim());
      return { label: label || "", time: time || "" };
    });
    const patch = {
      icon: iconSelect.value,
      color: "teal",
      group: f.group.value,
      name: f.name.value.trim(),
      age: f.age.value.trim() || "Novinka",
      location: f.location.value.trim(),
      description: f.description.value.trim(),
      schedule,
      featured: f.featured.checked,
      photo: krouzekPhoto.get(),
    };
    if (editingKrouzekId) {
      VTStore.krouzky.update(editingKrouzekId, patch);
    } else {
      VTStore.krouzky.add(patch);
    }
    resetKrouzekForm();
    renderKrouzky();
    updateCounts();
  });

  krouzekForm.querySelector("[data-cancel-edit]").addEventListener("click", resetKrouzekForm);

  document.getElementById("krouzky-list").addEventListener("click", (e) => {
    const editBtn = e.target.closest("button[data-action='edit-krouzek']");
    if (editBtn) {
      startEditKrouzek(editBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest("button[data-action='delete-krouzek']");
    if (delBtn) {
      if (confirm("Smazat tento kroužek?")) {
        if (editingKrouzekId === delBtn.dataset.id) resetKrouzekForm();
        VTStore.krouzky.remove(delBtn.dataset.id);
        renderKrouzky();
        updateCounts();
      }
    }
  });

  // ----------------------------------------------------------------- misc --
  document.getElementById("reset-all").addEventListener("click", () => {
    if (!confirm("Opravdu obnovit web do původního stavu? Smažou se všechny úpravy a nově přidané položky (kroužky, akce, aktuality, přihlášky) — vrátí se výchozí obsah webu.")) return;
    VTStore.resetAllToSeed();
    resetAktualitaForm();
    resetAkceForm();
    resetKrouzekForm();
    renderAll();
  });

  function renderAll() {
    renderSubmissions();
    renderAktuality();
    renderAkce();
    renderKrouzky();
    updateCounts();
  }

  renderAll();
})();

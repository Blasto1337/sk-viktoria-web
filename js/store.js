/*
  VTStore — shared browser-local data layer for the admin prototype.
  Everything lives in localStorage for now. Swap these functions for real
  API calls once the backend/database exists — the rest of the site only
  talks to VTStore, never to localStorage directly.

  On first load each collection is seeded from window.VT_SEED (js/seed.js)
  so the site's existing kroužky/akce/aktuality are editable through the
  admin from day one, not just items added there afterwards.
*/
(() => {
  "use strict";

  const KEYS = {
    submissions: "vt_submissions",
    aktuality: "vt_aktuality",
    akce: "vt_akce",
    krouzky: "vt_krouzky",
  };

  const SEED_FLAG = "vt_seeded_v1";

  function uid() {
    return `vt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function write(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  function makeCollection(key) {
    return {
      all() {
        return read(key);
      },
      add(item) {
        const list = read(key);
        const record = { id: uid(), createdAt: new Date().toISOString(), ...item };
        list.unshift(record);
        write(key, list);
        return record;
      },
      update(id, patch) {
        const list = read(key);
        const next = list.map((item) => (item.id === id ? { ...item, ...patch } : item));
        write(key, next);
      },
      remove(id) {
        const list = read(key).filter((item) => item.id !== id);
        write(key, list);
      },
      get(id) {
        return read(key).find((item) => item.id === id) || null;
      },
      clear() {
        write(key, []);
      },
      seedDefaults(seedItems) {
        if (!Array.isArray(seedItems) || !seedItems.length) return;
        const list = read(key);
        seedItems.forEach((seedItem) => {
          if (!list.some((it) => it.id === seedItem.id)) {
            list.push({ createdAt: new Date().toISOString(), ...seedItem });
          }
        });
        write(key, list);
      },
      resetToDefaults(seedItems) {
        write(key, []);
        this.seedDefaults(seedItems);
      },
    };
  }

  window.VTStore = {
    submissions: makeCollection(KEYS.submissions),
    aktuality: makeCollection(KEYS.aktuality),
    akce: makeCollection(KEYS.akce),
    krouzky: makeCollection(KEYS.krouzky),

    resetAllToSeed() {
      window.VTStore.submissions.clear();
      const seed = window.VT_SEED || {};
      window.VTStore.aktuality.resetToDefaults(seed.aktuality);
      window.VTStore.akce.resetToDefaults(seed.akce);
      window.VTStore.krouzky.resetToDefaults(seed.krouzky);
    },
  };

  if (!localStorage.getItem(SEED_FLAG)) {
    const seed = window.VT_SEED || {};
    window.VTStore.aktuality.seedDefaults(seed.aktuality);
    window.VTStore.akce.seedDefaults(seed.akce);
    window.VTStore.krouzky.seedDefaults(seed.krouzky);
    localStorage.setItem(SEED_FLAG, "1");
  }
})();

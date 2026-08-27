/*
  VTStore — shared browser-local data layer for the admin prototype.
  Everything lives in localStorage for now. Swap these functions for real
  API calls once the backend/database exists — the rest of the site only
  talks to VTStore, never to localStorage directly.
*/
(() => {
  "use strict";

  const KEYS = {
    submissions: "vt_submissions",
    aktuality: "vt_aktuality",
    akce: "vt_akce",
    krouzky: "vt_krouzky",
  };

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
    };
  }

  window.VTStore = {
    submissions: makeCollection(KEYS.submissions),
    aktuality: makeCollection(KEYS.aktuality),
    akce: makeCollection(KEYS.akce),
    krouzky: makeCollection(KEYS.krouzky),
  };
})();

# SK Viktoria Tábor — web (redesign)

Redesign webu sportovního klubu pro děti v Táboře. Klient: SK Viktoria Tábor.
Jádrem klubu je taneční složka — **VFRESH DC / street dance** — a ta má být na webu dominantní.
Repo: https://github.com/Blasto1337/sk-viktoria-web

## Stack

- Čistý statický web: HTML + CSS + vanilla JS. Žádný build, žádný framework, žádné npm.
- Fonty z Google Fonts: **Anton** (nadpisy, navigace) + **Nunito** (text).
- Lokální náhled: `python3 -m http.server 4173` (viz `.claude/launch.json`) → http://localhost:4173

## Struktura

```
index.html              hlavní stránka (hero → kroužky → akce → galerie → kontakt)
krouzky.html            přehled kroužků
kurz-*.html             detail každého kroužku (statické stránky)
kurz-detail.html        detail kroužku přidaného přes admin (?id=…)
akce.html               přehled akcí (filtry)
akce-*.html             detail akcí (statické)
akce-detail.html        detail akce přidané přes admin (?id=…)
gallery.html            galerie (filtry)
admin.html              administrační prototyp (aktuality / akce / kroužky / přihlášky)
css/style.css           veškeré styly veřejného webu, design tokeny v :root
css/admin.css           styly adminu
js/store.js             VTStore — datová vrstva nad localStorage
js/render-public.js     vykreslí obsah z VTStore do veřejných stránek
js/script.js            navigace, mobilní menu, drobné interakce
js/akce.js, gallery.js  filtrování karet
js/kurz-detail.js, akce-detail.js   detail položek z VTStore
js/admin.js             logika adminu
assets/hero, akce, gallery   obrázky
```

## Jak kód funguje

- **Obsah je psaný ručně v HTML.** Karty kroužků/akcí/galerie jsou statické. Změna obsahu = úprava HTML.
- **VTStore (`js/store.js`)** je jediná datová vrstva; drží data v `localStorage` (klíče `vt_*`).
  Zbytek webu mluví jen s `VTStore`, nikdy přímo s `localStorage`. Až bude backend, mění se jen `store.js`.
- `render-public.js` pouze *přidává* to, co admin vložil navíc — statické karty nemaže ani nepřepisuje.
- Všechny JS soubory jsou IIFE se `"use strict"`, bez modulů, bez závislostí.
- Pořadí skriptů na stránce: `store.js` → `script.js` → `render-public.js` (+ stránkové skripty).

## Design

- Design tokeny jsou CSS proměnné v `css/style.css` `:root` (`--navy`, `--gold`, `--purple`, `--stone`, `--cream`…). Barvy měň tam, ne inline.
- Aktuální směr (viz git log): purpurové pozadí, černý nav/footer/marquee, **zlaté karty (`--gold`) s navy hard-shadow** (`4px 4px 0 var(--navy)`), ostré rohy (`border-radius:0`) na kartách, Anton nadpisy s letter-spacingem.
- Karty kroužků/akcí/aktualit mají jednotný gold/navy vzhled — při přidávání nových prvků držet stejný styl.
- Hero komunikuje "VFRESH STREET DANCE", cílová skupina 10–15 let.

## Stav a otevřené body (zadání klienta 2026-08-29)

- ✅ Zachovat přehlednost webu.
- 🎨 Tmavší/muted pozadí — probíhá (purple + black).
- 🎭 STREET DANCE a VFRESH DC dominantní — hero hotové, ještě pořadí kroužků.
- ❌ **Hopík zaniká** (paní Čápová odchází) — `kurz-hopik.html` a karty v `index.html` / `krouzky.html` ještě **NEODEBRÁNY**.
- 🏃 **Silvestrovský běh** zůstává — zatím nerozhodnuto, zda akce nebo kroužek.
- 📸 Nové fotky VFRESH DC / street dance — čekají na dodání, nahradit v `assets/gallery` a `assets/akce`.
- ❓ STREET DANCE = samostatný kurz, rebranding Hopíka, nebo součást VFRESH DC? Nepotvrzeno.

Podrobná strategie je v Claude Projektu "Viktoria Tábor" → doc `claude/redesign-strategie`.

## Pravidla práce

- Jazyk webu i commitů: čeština na webu, commity anglicky krátce (viz stávající styl `git log`).
- Neměnit strukturu HTML víc, než je nutné — klient chce zachovat přehlednost.
- Nezavádět build nástroje, frameworky ani npm bez domluvy.
- Nový obsah přidávat do statického HTML, ne do VTStore (ten je jen pro admin prototyp).
- Po změnách zkontrolovat responsivitu (mobilní menu, karty, slider) a kontrast na tmavém pozadí.
- Před commitem: `git status`, nepřidávat `.DS_Store`.

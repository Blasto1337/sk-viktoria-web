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

## Zadání klienta (aktualizace 2026-09-07)

### Hlavička / brand
- Název v hlavičce: **VIKTORIA FRESH DANCE CENTER & SK Viktoria z.s.**
- Hlavní stránka: klientka chce **video v hero** (dodá) a výrazně **„Nová sezóna 2026/27"**.
- Zaniká: **Hopík**, cvičení seniorů, harmonizační cvičení → odebrat ze všech stránek (`kurz-hopik.html`, karty v `index.html`, `krouzky.html`).

### Struktura webu (3 bloky)

**1. VIKTORIA FRESH DANCE CENTER – VFRESH DC** (hlavní, dominantní)
Taneční kurzy STREET DANCE pro děti a mládež, rozdělené podle věku:

| Kategorie | Věk |
|---|---|
| Taneční školička FRESHÍK | 3–4 roky |
| VFRESH MINI BEAT | 5–8 let |
| DVK VFRESH CREW | 8–12 let |
| JVK VFRESH CREW | 12–16 let |
| Elita A tým | 14–21 let |
| VFRESH MATES | rodičovská CREW |
| Zumba & Dance | — |

- Lišta/marquee pro tento blok: *STREET DANCE CREW · Taneční školička FRESHÍK · VFRESH MINI BEAT · FRESH MATES · Zumba & DANCE*
- Rozvrh lekcí: klientka pošle v příloze (zatím nemáme).
- Sekce „Nábor do kroužků 2026/27".

**2. Volnočasové aktivity 2026/27**
- Sportuj s VIKTORKOU (info v příloze)
- Dramatický klub Viktoria (info v příloze) — lišta zmiňuje i „Dramáček", „Dramalab"
- Sportovní gymnastika Viktoria
- Viktoriánek — cvičení rodiče a děti (info v příloze)
- Lišta/marquee: *Sportuj s VIKTORKOU · Dramáček · Dramalab …*

**3. Akce**
- Sportuj v parku s VIKTORKOU — **16. 9.**
- Silvestrovský běh — **30. 12.** (je to akce, ne kroužek)

### Místa (rozdělit Tábor / Planá nad Lužnicí)
- VFRESH DC & SK Viktoria z.s., Vančurova 2904, 390 01 Tábor
- ZŠ Helsinská, Tábor
- Sídliště nad Lužnicí, Tábor
- AB STUDIO, OC MAGA, Planá nad Lužnicí

### Náborový text (použít na web, klíčové věci výrazně)
Nadpis: **Nábor tanečníků NOVÁ SEZÓNA 2026/27: Odstartuj svou taneční cestu!**

> Hledáš místo, kde můžeš být sám sebou, makat na sobě a patřit do komunity, která tě podrží?
> VFRESH DC otevírá brány a spouští nábor do všech tanečních CREW pro děti i dospělé od 3 let! Žijeme streetovou kulturou a předáme ti to nejlepší z ní.

Styly (seznam):
- **HIP HOP** – flow, groove a tvůj vlastní styl
- **HOUSE DANCE** – rychlá práce nohou a klubová energie
- **DANCEHALL** – karibský vibe, rytmus a sebevědomí
- **LOCKING** – funk, energie a čistá radost z pohybu
- …a spoustu dalších stylů napříč celou STREET scénou.

**Proč zrovna VFRESH DC?** Protože nejsme jenom taneční klub. Jsme rodina. Tanec je pro nás víc než jen kroky do hudby. Je to náš společný jazyk.
- **Rosteme společně:** na sále i mimo něj. Inspirujeme se navzájem a posouváme své hranice.
- **Tvoříme bez limitů:** Objevujeme nové styly, experimentujeme a hledáme tvou jedinečnost.
- **Prožíváme to naplno:** Sdílíme společný vibe, radost z úspěchů i sílu zvednout se, když se zrovna nedaří. Každý pád nás posouvá dál.
- **Pojí nás stejná krev:** Láska k tanci, respekt a přátelství, které vydrží.

Chceš tenhle vibe zažít na vlastní kůži? Přijď na zkušební lekce, naskoč do naší crew a ukaž, co v tobě je!

Slogan (**výrazně**): 🔥 **VFRESH DC – Tvoje crew. Tvoje cesta. Tvůj vibe. Tvůj domov.** 🔥

### Co ještě čekáme od klientky
- Rozvrh lekcí (příloha)
- Info-přílohy: Sportuj s VIKTORKOU, Dramatický klub, Viktoriánek
- Fotky a videa (hero video)

### Původní zadání (2026-08-29) — stále platí
- Zachovat přehlednost webu; tmavší/muted pozadí (probíhá: purple + black).
- STREET DANCE / VFRESH DC dominantní (hero hotové).
- Nové fotky do `assets/gallery` a `assets/akce`.

Podrobná strategie je v Claude Projektu „Viktoria Tábor" → doc `claude/redesign-strategie`.

## Pravidla práce

- Jazyk webu i commitů: čeština na webu, commity anglicky krátce (viz stávající styl `git log`).
- Neměnit strukturu HTML víc, než je nutné — klient chce zachovat přehlednost.
- Nezavádět build nástroje, frameworky ani npm bez domluvy.
- Nový obsah přidávat do statického HTML, ne do VTStore (ten je jen pro admin prototyp).
- Po změnách zkontrolovat responsivitu (mobilní menu, karty, slider) a kontrast na tmavém pozadí.
- Před commitem: `git status`, nepřidávat `.DS_Store`.

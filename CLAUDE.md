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
podklady/               originální podklady od klientky (PDF nábor, leták Zumba)
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

| Kategorie | Věk | Pravidelně | Zkušební lekce zdarma |
|---|---|---|---|
| Taneční školička FRESHÍK | 3–4 roky | ST 16:00–17:00 | 9. 9., 23. 9. |
| VIKTORIA FRESH MINI BEAT | 5–8 let (předškolní) | ÚT 16:30–17:30 | 8. 9., 22. 9. |
| STREET DANCE CREW / DVK VFRESH CREW | 8–11 (12) let | ⚠️DUMMY ÚT 17:45–19:15 + ČT 16:30–18:00, gymnastika PÁ 15:30–16:30 | 10. 9., 17. 9. 16:30–18:00 |
| STREET DANCE CREW / JVK VFRESH CREW | 12–14 (16) let | ⚠️DUMMY PO 17:00–18:30 + ST 17:00–18:30, gymnastika PÁ 16:30–17:30 | 23. 9. 17:00–18:30 |
| A FRESH CREW – pokročilí / Elita A tým | 15–21 let | ⚠️DUMMY ÚT 19:15–20:45 + ČT 18:00–19:30, gymnastika PÁ 17:30–18:30 | 22. 9. 17:30–19:00 (nutná taneční zkušenost) |
| VIKTORIA FRESH MATES (rodičovská crew, Hobby Masters) | dospělí | ST 18:30–20:00, od října | — |
| Zumba & Dance (dospělí začátečníci) | dospělí | PO 17:45–18:45 | 14. 9. první lekce zdarma |

- Věkové hranice se v e-mailu a v PDF mírně liší (8–12 vs 8–11, 12–16 vs 12–14/15, 14+ vs 15+). Na web použít **rozsahy z PDF** (novější, oficiální leták), pokud klientka neřekne jinak.
- **Časy DVK / JVK / A crew označené ⚠️DUMMY jsou vymyšlené placeholdery** (nekolidují s FRESHÍK/MINI BEAT/MATES, drží 2×1,5 h tance + 1 h gymnastiky dle PDF). Na webu je označit jako „rozvrh upřesníme" a **nahradit skutečným rozvrhem, jakmile ho klientka pošle**.

Týdenní přehled (Tábor, sál VFRESH DC; Zumba je v Plané):

| Den | Čas | Skupina |
|---|---|---|
| PO | 17:00–18:30 | JVK ⚠️DUMMY |
| PO | 17:45–18:45 | Zumba & Dance (Planá n. L.) |
| ÚT | 16:30–17:30 | MINI BEAT |
| ÚT | 17:45–19:15 | DVK ⚠️DUMMY |
| ÚT | 19:15–20:45 | A FRESH CREW ⚠️DUMMY |
| ST | 16:00–17:00 | FRESHÍK |
| ST | 17:00–18:30 | JVK ⚠️DUMMY |
| ST | 18:30–20:00 | FRESH MATES (od října) |
| ČT | 16:30–18:00 | DVK ⚠️DUMMY |
| ČT | 18:00–19:30 | A FRESH CREW ⚠️DUMMY |
| PÁ | 15:30–16:30 | Gymnastika DVK ⚠️DUMMY |
| PÁ | 16:30–17:30 | Gymnastika JVK ⚠️DUMMY |
| PÁ | 17:30–18:30 | Gymnastika A crew ⚠️DUMMY |
- Obecné: „Nestihneš termín? Domluv si svoji 1 lekci zdarma do konce září."

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

### Zumba & Dance — podzimní kurz (leták, `podklady/zumba-dance-podzim-2026.png`)
- Pro dospělé začátečníky. **Každé pondělí 17:45–18:45**, AB STUDIO (OC MAGA), Planá nad Lužnicí.
- **14. 9.: první lekce zdarma** (nezávazně). Kurz **21. 9. – 14. 12. (12 lekcí)**, cena **1 550 Kč**, jednorázový vstup **150 Kč** (jen do konce září).
- Od října se skupina uzavírá (aby nováčci nezpomalovali pokročilé). Omezená kapacita.
- Rezervace: tel. 607 825 318, e-mail lena.cimpova@seznam.cz.
- Vizuál letáku: růžová/fialová/oranžová, štětcové písmo — na webu držet náš gold/navy styl, jen převzít obsah.

### VFRESH DC — obsah z náborového PDF (`podklady/vfresh-dc-nabor-2026-27.pdf`)
**Příběh / „O nás" (použít na úvod sekce nebo O nás):**
- Z malého tanečního klubu pod SK Viktoria vzniká moderní taneční centrum **Viktoria Fresh DC** s novým názvem **VFRESH DC**.
- Ve spolupráci s **Centrem Univerzity Tábor** otevírají moderní taneční, pohybové a volnočasové centrum **VIKTORIA FRESH DC & SK Viktoria z.s.** v srdci Tábora — multifunkční, mezigenerační prostor.
- **SK Viktoria z.s. funguje od roku 1990**: sportovní gymnastika, taneční klub, rekreační sport a aktivity pro celou rodinu. Nově: dramatický klub, Sportuj s VIKTORKOU, Zumba & Dance, Viktoriánek.
- Nový domov v centru Tábora: sál se zrcadly, dětská herna Safari, moderní restaurace („už žádné nudné čekání na chodbách").

**Benefity pro členy:** sleva na kávu v restauraci pro rodiče · zvýhodněný vstup do herny Safari · doprava na soutěže se spoluúčastí klubu · sourozenecká sleva · sleva na druhý kurz · od září příspěvek Jihočeského kraje „Pomáháme s kroužky pro jihočeské děti".

**Vize:** zábava a respekt k lektorovi — bez tlaku na výkon, ale ne „alternativní kroužek"; individuální přístup; u nejmenších hravě, ale s pravidly a cílem.

**Dvě cesty:**
- **Rekreační tanec** — pro radost, pohyb, partu; galapředstavení v květnu. Nabírá se ve všech kategoriích.
- **Soutěžní úroveň — VIKTORIA FRESH DC CREW**: DVK 8–11, JVK 12–15, A skupina 15–20. Příprava 3 h tance týdně + 1 h gymnastické průpravy.

**Styly / programy:** STREET DANCE HIP HOP (energické choreografie na aktuální hudbu) · STREET DANCE FREESTYLE (improvizace, vlastní styl, choreografie s dějem, rekvizity a kulisy). Základy i advanced level: HIP HOP, HOUSE DANCE, DANCEHALL, LOCKING a další.

**Externí lektoři:** Adam Kmenta (Fantasy DC Praha), Barbora Grulichová (Movement Company Brandýs nad Labem) a další.

**Popisy kategorií:**
- FRESHÍK (3–4): pohybová, výrazová a rytmická průprava, hravé pomůcky (padák, šátky, značky), vlastní deník + motivační samolepky.
- MINI BEAT (5–8): základní pohybová průprava, koordinace, první krůčky ke streetovým stylům.
- FRESH MATES (dospělí, od října, ST 18:30–20:00): „NESEĎTE NA CHODBĚ!" — tanec, parta, recese, trochu divadla; čistá hlava; žádné zkušenosti netřeba; buďte dětem vzorem.

**CTA:** „Klikněte na odkaz a přihlaste své dítě na ukázkovou lekci ještě dnes." → přihlašovací formulář / odkaz na zkušební lekci.

**Odchylky PDF vs. e-mail:** slogan v PDF je „Tvoje crew. Tvůj vibe. Tvůj domov." (bez „Tvoje cesta"); „Jsme jedna rodina"; „Přijď na nábor" místo „na zkušební lekce". Preferovat verzi z e-mailu (novější), ale jsou to drobnosti.

### Co ještě čekáme od klientky
- Rozvrh pravidelných tréninků DVK / JVK / A crew — zatím DUMMY, nahradit skutečným
- Info-přílohy: Sportuj s VIKTORKOU, Dramatický klub, Viktoriánek
- Fotky a videa (hero video)

### Stav webu (2026-09-07) — brief promítnut na web
- Hlavička/patička: brand v navbaru je nyní "VFRESH DC", plný právní název "Viktoria Fresh Dance Center & SK Viktoria z.s." je v patičce.
- Hopík, cvičení seniorů a harmonizační cvičení odebrány ze všech stránek (kurz-hopik.html smazán).
- krouzky.html rozdělen na 2 vizuální bloky: "VFRESH DC" (dominantní, vlastní lišta) a "Volnočasové aktivity 2026/27" (vlastní lišta) — homepage má jednu sloučenou lištu a přeuspořádaný preview grid (VFRESH DC první).
- Nová stránka `kurz-zumba.html` (Zumba & Dance, dospělí, AB Studio Planá n. L., ceník a termíny z letáku).
- kurz-vfresh-dc.html: rozvrh podle klientské tabulky, DVK/JVK/A crew časy schválně NEJSOU na webu (jen "rozvrh upřesníme") — nahradit až přijdou reálné časy. Přidána nábor sekce (styly, "Proč zrovna VFRESH DC", slogan) a adresa Vančurova 2904.
- Kontaktní sekce na indexu: lokace rozdělené Tábor/Planá, select v kontakt. formuláři aktualizovaný (bez Hopíka, + Zumba).
- Nedotčeno (čeká na rozhodnutí/podklady): obsah stránky Akce (staré nábor karty VFRESH DC/Dramatický klub/Sportuj s Viktorkou/Fresh Mates mají jiná data než brief; nové akce "Sportuj v parku 16.9" a "Silvestrovský běh 30.12" ještě nejsou na webu), hero video, texty pro Sportuj s Viktorkou/Dramatický klub/Viktoriánek z příloh.

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

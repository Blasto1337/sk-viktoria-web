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
podklady/               originální podklady od klientky (letáky, rozvrh, PDF, reel) — gold source, nepatří na web přímo
```

## Jak kód funguje

- **Obsah je psaný ručně v HTML.** Karty kroužků/akcí/galerie jsou statické. Změna obsahu = úprava HTML.
- **VTStore (`js/store.js`)** je jediná datová vrstva; drží data v `localStorage` (klíče `vt_*`). Výchozí obsah je v `js/seed.js`; **po každé změně seed.js zvyš `SEED_VERSION` v store.js** — seed položky se pak v prohlížečích obnoví, položky přidané v adminu zůstanou.
  Zbytek webu mluví jen s `VTStore`, nikdy přímo s `localStorage`. Až bude backend, mění se jen `store.js`.
- `render-public.js` pouze *přidává* to, co admin vložil navíc — statické karty nemaže ani nepřepisuje.
- Všechny JS soubory jsou IIFE se `"use strict"`, bez modulů, bez závislostí.
- Pořadí skriptů na stránce: `store.js` → `script.js` → `render-public.js` (+ stránkové skripty).

## Design

- Design tokeny jsou CSS proměnné v `css/style.css` `:root` (`--navy`, `--gold`, `--purple`, `--purple-deep`, `--stone`, `--cream`…). Barvy měň tam, ne inline.
- **Dvě fialové:** `--purple:#7a5af8` (světlejší) je vyhrazená jen pro hero sekci na homepage (`.hero`, `.hero::before` — přes fotku tanečníků, opacity .74). `--purple-deep:#5946b2` (tmavší, zadaná klientkou 2026-09-10) je základní fialová pro zbytek webu — pozadí `body`, `.main-nav` hover/active, `.tag-purple`, `.course-hero` (detail kroužku/akce, mimo homepage hero).
- Aktuální směr (viz git log): purpurové pozadí, černý nav/footer/marquee, **zlaté karty (`--gold`) s navy hard-shadow** (`4px 4px 0 var(--navy)`), ostré rohy (`border-radius:0`) na kartách, Anton nadpisy s letter-spacingem.
- Karty kroužků/akcí/aktualit mají jednotný gold/navy vzhled — při přidávání nových prvků držet stejný styl.
- Hero komunikuje "VFRESH STREET DANCE", cílová skupina 10–15 let.
- Homepage má mezi hero a kroužky sekci „Kdo jsme" (`#o-nas`, `.about`) — fotka + krátký text (≤400 znaků) o SK Viktoria Tábor & VFRESH DC. Foto `assets/hero/dancers-hero.jpg` (původní hero foto, teď nepoužité jinde). Zdroj textu: e‑mail klientky "Fwd: Re: Prvni nastrel webu" (2026-09-06, v repu jen lokálně, 30 MB s přílohami — nekomitovat, obsah už je vytažený do `podklady/`).

## Zadání klienta (aktualizace 2026-09-07)

### Hlavička / brand
- Název v hlavičce: **VIKTORIA FRESH DANCE CENTER & SK Viktoria z.s.**
- Hlavní stránka: klientka chce **video v hero** (dodá) a výrazně **„Nová sezóna 2026/27"**.
- Zaniká: **Hopík**, cvičení seniorů, harmonizační cvičení → odebrat ze všech stránek (`kurz-hopik.html`, karty v `index.html`, `krouzky.html`).

### Struktura webu (3 bloky)

**1. VIKTORIA FRESH DANCE CENTER – VFRESH DC** (hlavní, dominantní)
Taneční kurzy STREET DANCE pro děti a mládež, rozdělené podle věku:

**Oficiální rozvrh od klientky** (`podklady/rozvrh-kurzu-2026-27.jpg`, Centrum Univerzita Tábor = CUT) — zdroj pravdy, nahrazuje dřívější dummy časy:

| Kurz | Věk | Četnost | Den / čas | Zkušební lekce zdarma (září) |
|---|---|---|---|---|
| FRESHÍK (taneční školička hrou) | 3–4 roky | 1×/týden | ST 16:00–17:00 | 9. 9., 23. 9. |
| VFRESH MINI BEAT | 5–8 let | 1–2×/týden | ÚT 16:30–17:30 | 8. 9., 22. 9. |
| VFRESH CREW DVK (soutěžní) | 8–12 let | 2×/týden + 1× sport. gymnastika | ÚT 15:00–16:30, ČT 16:30–18:00 | 10. 9., 17. 9. 16:30–18:00 |
| VFRESH JVK (soutěžní) | 12–15 let | 2×/týden | ST 17:00–18:30, PÁ 15:00–16:30 | 23. 9. 17:00–18:30 |
| VFRESH A – HVK, JVK pokročilí | 14–20 let | 2×/týden | ÚT 17:30–19:00, ČT 18:00–19:30 | 22. 9. 17:30–19:00 (nutná zkušenost) |
| VFRESH rekreační STREET děti | 7–14 let | 1×/týden, **ZŠ Helsinská** | ÚT 15:30–17:00 | — |
| VFRESH MATES (rodičovská) | 25+ neomezeně | 1×/týden | ST 18:30–20:00 (od října) | — |
| Zumba DANCE ranní (Tábor, CUT) | dospělí začátečníci, hlídání dětí v ceně | 1×/týden | ST 8:15–9:15 | 9. 9. 18:00–19:00 |
| Zumba DANCE večerní (Tábor, CUT) | dospělí (+ dcery 10+) | 1×/týden | ÚT 19:00–20:00 | 9. 9. 18:00–19:00 |
| Zumba & Dance (Planá n. L., AB Studio) | dospělí začátečníci | 1×/týden | PO 17:45–18:45 | 14. 9. |
| SPORTUJ S VIKTORKOU A | 3–7 let (PDF: 3–6), pohybové hry | 1×/týden, CUT | ČT 15:30–16:30 | 10. 9. 15:30–16:30 |
| SPORTUJ S VIKTORKOU B | 4–7 a 7–12 let, míčové sporty + atletika | 1×/týden, **ZŠ Helsinská** | ST 16:00–17:00 (4–7), 17:00–18:00 (7–12) | 9. 9. |
| Viktoriánek (rodiče a děti) | 1,5–3 roky | 1×/týden | ÚT, ČT 9:30–10:30 | 8. 9., 10. 9., 17. 9. |
| Dramáček (dramatický kroužek) | 3–6 let | 1×/týden | ST 15:00–16:00 | 9. 9. |
| Dramalab (divadlo) | 7–12 let | 1×/týden | ST 14:00–15:00 | 9. 9., 23. 9. |
| Sportovní gymnastika | 5–15 let | 1×/týden, **Gymnázium** | ST 15:30–17:30 | — |

- Věkové hranice: řídit se rozvrhem (DVK 8–12, JVK 12–15, A 14–20). Sportuj A: rozvrh 3–7, PDF 3–6 → použít 3–7.
- Obecné: „Nestihneš termín? Domluv si svoji 1 lekci zdarma do konce září." Dramáček/Dramalab: přihlašování celé září.
- Zumba jsou **tři** produkty: Planá (PO, 1 550 Kč / 21. 9.–14. 12., vstup 150 Kč) a Tábor CUT ranní + večerní (blok 17. 9.–19. 12., 12 lekcí, 1 560 Kč/blok, jednotlivá lekce 130 Kč; ÚT nekoná se 17. 11., ST nekoná se 28. 10.; ranní s hlídáním dětí v ceně).
- Soutěžní crew mají navíc 1 h sportovní gymnastiky týdně (den neuveden).
- Místo tanečních kurzů: nové taneční centrum v CUT Tábor, Vančurova 2904 — **přízemí, bývalý prostor PARTY ROOM**.

- Lišta/marquee pro tento blok: *STREET DANCE CREW · Taneční školička FRESHÍK · VFRESH MINI BEAT · FRESH MATES · Zumba & DANCE*
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

### Materiály od klientky v `assets/` (nahráno 2026-09-10) — co v nich je
Přesunuto do `podklady/` s čistými názvy (2026-09-10). Jsou to podklady — na web dávat jen ořezané/komprimované verze.

| Soubor | Co to je | Použitelné na webu |
|---|---|---|
| `rozvrh-kurzu-2026-27.jpg` | Oficiální tabulka rozvrhu (viz výše) | data ano; obrázek ne |
| `vfresh-dc-nabor-2026-27.pdf` | Náborový text (= `podklady/vfresh-dc-nabor-2026-27.pdf`) | text ano |
| `sportuj-s-viktorkou-nabor.pdf` | Text náboru: Směr A pohybové hry 3–6 (CUT, ukázka 10. 9. 15:30), Směr B míčové hry + atletika 4–7 / 7–12 (ZŠ Helsinská, ukázka 9. 9.); „žádný stres z víkendových zápasů" | text ano |
| `letak-nabor-street-dance-crew-8-12.png` | Leták NÁBOR VFRESH DC – STREET DANCE CREW 8–12, zkušební 10. 9./17. 9.; slogan „Tvoje CREW. Tvůj Vibe. Tvoje rodina."; FB **FRESHDANCE SK Viktoria Tábor** | data; foto dětí v pozadí je malé |
| `letak-zapis-freshik-minibeat.png` | Leták ZÁPIS FRESHÍK + MINI BEAT; **„Poslední volná místa: FRESHÍK 5 míst, MINI BEAT 7 míst"** | aktualita |
| `letak-dramacek-3-6.png` | Leták Dramáček 3–6, ST 15–16, ukázka 9. 9.; motto „Vykul oči, nastraž uši, divadlo ti vážně sluší" | text |
| `letak-dramalab-7-12.png` | Leták Dramalab 7–12, ST 14–15, ukázky 9. 9. a 23. 9.; motto „Dělá Vaše dítě doma scény? My ho to naučíme pořádně!" | text |
| `letak-viktorianek-1.5-3.png` | Leták Viktoriánek 1,5–3: zkušební 8./10./17. 9. 9:30; 1 900 Kč / permanentka 10 vstupů (5 měsíců); **45 min cvičení + 30 min herna Safari**; bezbariérově, kočárky; partneři NSA, Tábor, ČUS, Jihočeský kraj, Safari; web www.viktoria-tabor.cz | text, loga partnerů |
| `benefity-tanecnici-vfresh-dc.png` | **Benefity pro tanečníky VFRESH DC**: sourozenecká sleva 20 %, sleva na druhý kurz 20 %, sleva na vstupné do Safari a restaurace, příspěvek na dopravu autobusem na soutěže, zvýhodněná cena workshopů, věrnostní sleva 5 % | sekce Benefity |
| `benefity-clenove-viktoria.png` | **Benefity pro členy Viktoria z.s.**: sourozenecká 20 %, druhý kurz 20 %, Safari + restaurace, Zumba&Dance 20 %, masáže 20 %, příměstské pobyty a akce 15 % | sekce Benefity |
| `letak-obecny-3-slozky.png` | Obecný leták „3 složky": 1 Taneční složka, 2 Dramatický kroužek, 3 Sportovní průprava; „Proč vsadit na…"; adresa **Vančurova 2904, CUT Tábor**; hashtagy | text pro O nás |
| `letak-zumba-tabor-cut.png` | Leták Zumba Tábor (CUT): ÚT 19–20 + ST 8:15–9:15, ukázka 9. 9. 18–19, blok 17. 9.–19. 12., 1 560 Kč, lekce 130 Kč, ranní s hlídáním | nová stránka/sekce |
| `reel-sportuj-zs-helsinska.mp4` | Vertikální reel 35 s „sportovní kroužek ZŠ Helsinská" | max. do detailu Sportuj s Viktorkou, ne hero |
| `hero/fresh-dance-hero.jpg` | Ilustrace street dance crew (AI/stock look), už použitá v hero | ano, ale klientka chtěla skutečné fotky |

Kontakty všude stejné: **607 825 318** (i SMS), **lena.cimpova@seznam.cz**, FB **FRESHDANCE SK Viktoria Tábor**, IG @viktoriatabor.

### Co ještě čekáme od klientky
- Hero video: dodané `podklady/reel-sportuj-zs-helsinska.mp4` je vertikální reel (576×1024, 35 s) o Sportuj s Viktorkou na ZŠ Helsinská — ne hero materiál. Skutečné fotky tanečníků stále chybí (v letácích jsou, ale malé/oříznuté).
- Den gymnastické průpravy pro soutěžní crew.
- Domény: leták Viktoriánek uvádí **www.viktoria-tabor.cz** — ověřit, zda existuje / kam web poběží.

### Stav webu (2026-09-10) — materiály z `podklady/` promítnuty
- `kurz-vfresh-dc.html`: skutečný rozvrh DVK/JVK/A (věk 8–12 / 12–15 / 14–20), nová kategorie Rekreační STREET děti 7–14 (ZŠ Helsinská), místo = CUT přízemí (Party Room), blok Benefity pro tanečníky.
- `kurz-zumba.html`: dva sloupce — Tábor CUT (ÚT 19:00, ST 8:15 s hlídáním, blok 17. 9.–19. 12., 1 560 Kč, 130 Kč lekce, ukázka 9. 9.) + Planá (PO 17:45, 1 550 Kč).
- `kurz-gymnastika.html`: ST 15:30–17:30, Gymnázium Tábor. `kurz-viktorianek.html`: ÚT + ČT, 30 min herna, zkušební 8./10./17. 9. `kurz-telovychova.html`: Směr A 3–7 (CUT, ČT 15:30, ukázka 10. 9.), Směr B 4–7 / 7–12 (ZŠ Helsinská, ST, ukázka 9. 9.), texty z PDF. `kurz-dramaticky-klub.html`: ukázkové lekce, motta, místo.
- `index.html`: Kdy trénujeme kompletní PO–PÁ, nová sekce **Benefity pro členy** (2 karty dle grafik), kontaktní místa upřesněna (CUT/Party Room, ZŠ Helsinská, Gymnázium, AB Studio).
- `js/seed.js`: nová karta `street-deti` (group vfresh, featured:false → jen na krouzky.html), aktualizované popisy/místa, 3 nové aktuality (poslední volná místa FRESHÍK 5 / MINI BEAT 7, zkušební lekce do 30. 9., Zumba Tábor). Prošlé aktuality (otevření 1. 9., zápis 1.–3. 9.) odstraněny. `SEED_VERSION = "2"`.
- Stále chybí: hero video, skutečné fotky do galerie/karet (`photo: null`), loga partnerů (jsou v letáku Viktoriánek — NSA, Tábor, ČUS, Jihočeský kraj, Safari; na webu jen textové placeholdery).

### Stav webu (2026-09-07) — brief promítnut na web
- Hlavička/patička: brand v navbaru je nyní "VFRESH DC", plný právní název "Viktoria Fresh Dance Center & SK Viktoria z.s." je v patičce.
- Hopík, cvičení seniorů a harmonizační cvičení odebrány ze všech stránek (kurz-hopik.html smazán).
- krouzky.html rozdělen na 2 vizuální bloky: "VFRESH DC" (dominantní, vlastní lišta) a "Volnočasové aktivity 2026/27" (vlastní lišta) — homepage má jednu sloučenou lištu a přeuspořádaný preview grid (VFRESH DC první).
- Nová stránka `kurz-zumba.html` (Zumba & Dance, dospělí, AB Studio Planá n. L., ceník a termíny z letáku).
- kurz-vfresh-dc.html: rozvrh podle klientské tabulky, DVK/JVK/A crew časy schválně NEJSOU na webu (jen "rozvrh upřesníme") — nahradit až přijdou reálné časy. Přidána nábor sekce (styly, "Proč zrovna VFRESH DC", slogan) a adresa Vančurova 2904.
- Kontaktní sekce na indexu: lokace rozdělené Tábor/Planá, select v kontakt. formuláři aktualizovaný (bez Hopíka, + Zumba).
- Akce: staré placeholder nábor karty (VFRESH DC/Dramatický klub/Sportuj s Viktorkou/Fresh Mates s daty, které brief nepotvrzuje) byly odstraněny. Nahrazeny dvěma akcemi z briefu: `akce-sportuj-v-parku.html` (16. 9.) a `akce-silvestrovsky-beh.html` (30. 12.) — obě mají jen datum potvrzené briefem, čas/místo/trasu je potřeba od klientky doplnit.
- Nedotčeno (čeká na podklady): hero video, texty pro Sportuj s Viktorkou/Dramatický klub/Viktoriánek z příloh.

### Původní zadání (2026-08-29) — stále platí
- Zachovat přehlednost webu; tmavší/muted pozadí (probíhá: purple + black).
- STREET DANCE / VFRESH DC dominantní (hero hotové).
- Nové fotky do `assets/gallery` a `assets/akce`.

Podrobná strategie je v Claude Projektu „Viktoria Tábor" → doc `claude/redesign-strategie`.

## Pravidla práce

- Jazyk webu i commitů: čeština na webu, commity anglicky krátce (viz stávající styl `git log`).
- **Žádné pomlčky (—) v běžném českém textu na webu** (nadpisy, popisky, věty, meta description, hlášky v adminu). Místo nich čárka, dvojtečka, závorka nebo nová věta — podle kontextu. Datumové/číselné rozsahy (např. „3–20 let", „17:45–18:45") používají spojovník/en-dash `–`, ten se netýká, zůstává. `<title>` tagy a `document.title` oddělují stránku a web pomocí ` | ` (ne pomlčkou). Nadpisy typu „Místo · Podnázev" používají `·` (interpunkt), stejně jako zbytek webu (patička, tagy). Výjimka: `—` jako placeholder prázdné hodnoty v dynamických polích (např. `<span id="k-age">—</span>`, než se načte JS) zůstává, to není text.
- Neměnit strukturu HTML víc, než je nutné — klient chce zachovat přehlednost.
- Nezavádět build nástroje, frameworky ani npm bez domluvy.
- Nový obsah přidávat do statického HTML, ne do VTStore (ten je jen pro admin prototyp).
- Po změnách zkontrolovat responsivitu (mobilní menu, karty, slider) a kontrast na tmavém pozadí.
- Před commitem: `git status`, nepřidávat `.DS_Store`.

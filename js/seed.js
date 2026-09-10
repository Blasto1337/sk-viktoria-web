/*
  Default site content, seeded into VTStore on first load so every kroužek/
  akce/aktualita is uniformly editable through the admin — not just items
  added there. Seeded items carry `seed:true` and can't be deleted through
  the admin (only edited), so the site never ends up with an empty grid.
*/
window.VT_SEED = {
  krouzky: [
    {
      id: "vfresh-dc", seed: true, group: "vfresh", featured: true,
      icon: "dance", color: "purple",
      name: "VFRESH DC",
      age: "3–20 let", location: "CUT Tábor, Vančurova 2904",
      description: "Street dance pro děti a mládež: Freshík, Mini Beat, soutěžní DVK/JVK/A crew i rekreační street.",
      photo: null, detailHref: "kurz-vfresh-dc.html",
    },
    {
      id: "zumba", seed: true, group: "vfresh", featured: true,
      icon: "pulse", color: "pink",
      name: "Zumba & Dance",
      age: "dospělí", location: "Tábor (CUT) & Planá n. L.",
      description: "Taneční fitness pro dospělé: Tábor út večer a st ráno (s hlídáním dětí), Planá po večer.",
      photo: null, detailHref: "kurz-zumba.html",
    },
    {
      id: "street-deti", seed: true, group: "vfresh", featured: false,
      icon: "dance", color: "purple",
      name: "Rekreační STREET DANCE děti",
      age: "7–14 let", location: "ZŠ Helsinská, Tábor",
      description: "Street dance pro radost bez soutěžení, úterý 15:30–17:00 na Sídlišti nad Lužnicí.",
      photo: null, detailHref: "kurz-vfresh-dc.html",
    },
    {
      id: "gymnastika", seed: true, group: "volnocas", featured: true,
      icon: "medal", color: "teal",
      name: "Sportovní gymnastika",
      age: "5–15 let", location: "Gymnázium Tábor",
      description: "Od prvních kotoulů po závodní medaile. Středa 15:30–17:30.",
      photo: null, detailHref: "kurz-gymnastika.html",
    },
    {
      id: "telovychova", seed: true, group: "volnocas", featured: true,
      icon: "kids-sport", color: "yellow",
      name: "Sportuj s VIKTORKOU",
      age: "3–12 let", location: "CUT Tábor & ZŠ Helsinská",
      description: "Pohybové hry a soutěže (3–7) nebo míčové hry a atletika (4–12). Bez stresu z víkendových zápasů.",
      photo: null, detailHref: "kurz-telovychova.html",
    },
    {
      id: "dramaticky-klub", seed: true, group: "volnocas", featured: true,
      icon: "theater", color: "blue",
      name: "Dramatický klub",
      age: "3–12 let", location: "CUT Tábor",
      description: "Dramáček (3–6) a Dramalab (7–12): divadelní hra, správná mluva a zdravé sebevědomí.",
      photo: null, detailHref: "kurz-dramaticky-klub.html",
    },
    {
      id: "viktorianek", seed: true, group: "volnocas", featured: true,
      icon: "toddler", color: "red",
      name: "Viktoriánek",
      age: "1,5–3 roky", location: "CUT Tábor",
      description: "Dopolední cvičení rodiče a děti, út a čt 9:30, po cvičení herna Safari.",
      photo: null, detailHref: "kurz-viktorianek.html",
    },
  ],

  akce: [
    {
      id: "sportuj-v-parku", seed: true, featured: true,
      tag: "NÁBOR", color: "red", category: "nabor",
      title: "Sportuj v parku s VIKTORKOU",
      date: "16. 9. 2026", location: "Tábor",
      description: "Venkovní sportovní odpoledne pro děti, hry, pohyb a základy sportů pod širým nebem.",
      bullets: [
        "Venkovní sportovní odpoledne pro děti, hry, pohyb a základy nejrůznějších sportů",
        "Ochutnávka kroužku Sportuj s VIKTORKOU přímo pod širým nebem",
        "Vhodné oblečení do přírody a sportovní obuv",
        "Zájemci se mohou přihlásit i rovnou na pravidelný kroužek",
      ],
      photo: "assets/akce/sportuj-s-viktorkou.jpg",
      detailHref: "akce-sportuj-v-parku.html",
    },
    {
      id: "silvestrovsky-beh", seed: true, featured: true,
      tag: "ZÁVOD", color: "teal", category: "zavody",
      title: "Silvestrovský běh",
      date: "30. 12. 2026", location: "Tábor",
      description: "Tradiční sportovní rozloučení se starým rokem, pro děti i dospělé.",
      bullets: [
        "Tradiční sportovní rozloučení se starým rokem, pro děti i dospělé, bez ohledu na výkonnost",
        "Otevřeno všem, kdo si chtějí protáhnout nohy před silvestrovskou oslavou",
        "Podrobnosti k trase, startovnému a registraci doplníme",
      ],
      photo: null,
      detailHref: "akce-silvestrovsky-beh.html",
    },
  ],

  aktuality: [
    {
      id: "posledni-mista", seed: true,
      date: "září 2026",
      text: "Poslední volná místa: Taneční školička FRESHÍK 3–4 roky (st 16:00), 5 míst, VFRESH MINI BEAT 5–8 let (út 16:30), 7 míst. Přihlášky: 607 825 318 nebo lena.cimpova@seznam.cz.",
      photo: null,
    },
    {
      id: "zkusebni-lekce", seed: true,
      date: "do 30. 9. 2026",
      text: "Zkušební lekce zdarma ve všech kroužcích celé září. Nestihli jste termín? Domluvte si svoji 1 lekci zdarma do konce září.",
      photo: null,
    },
    {
      id: "zumba-tabor", seed: true,
      date: "od 17. 9. 2026",
      text: "Nový podzimní blok Zumba & Dance v Táboře (CUT): úterý 19:00 a středa 8:15 s hlídáním dětí v ceně. Ukázková lekce zdarma 9. 9. v 18:00.",
      photo: null,
    },
  ],
};

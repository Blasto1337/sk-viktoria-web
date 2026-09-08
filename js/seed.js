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
      age: "3–20 let", location: "Vančurova 2904, Tábor",
      description: "Street dance pro děti a mládež — Freshík, Mini Beat, DVK/JVK/A crew.",
      photo: null, detailHref: "kurz-vfresh-dc.html",
    },
    {
      id: "zumba", seed: true, group: "vfresh", featured: true,
      icon: "pulse", color: "pink",
      name: "Zumba & Dance",
      age: "dospělí", location: "AB Studio, Planá n. L.",
      description: "Taneční fitness pro dospělé začátečníky, pondělní podvečery.",
      photo: null, detailHref: "kurz-zumba.html",
    },
    {
      id: "gymnastika", seed: true, group: "volnocas", featured: true,
      icon: "medal", color: "teal",
      name: "Sportovní gymnastika",
      age: "5–15 let", location: "",
      description: "Od prvních kotoulů po závodní medaile.",
      photo: null, detailHref: "kurz-gymnastika.html",
    },
    {
      id: "telovychova", seed: true, group: "volnocas", featured: true,
      icon: "kids-sport", color: "yellow",
      name: "Sportuj s VIKTORKOU",
      age: "4–12 let", location: "ZŠ Helsinská, Tábor",
      description: "Hry, pohyb a základy všech sportů.",
      photo: null, detailHref: "kurz-telovychova.html",
    },
    {
      id: "dramaticky-klub", seed: true, group: "volnocas", featured: true,
      icon: "theater", color: "blue",
      name: "Dramatický klub",
      age: "3–12 let", location: "",
      description: "Divadlo, improvizace a radost z vystupování před lidmi.",
      photo: null, detailHref: "kurz-dramaticky-klub.html",
    },
    {
      id: "viktorianek", seed: true, group: "volnocas", featured: true,
      icon: "toddler", color: "red",
      name: "Viktoriánek",
      age: "1,5–3 roky", location: "",
      description: "Cvičení rodiče a děti a další společné aktivity.",
      photo: null, detailHref: "kurz-viktorianek.html",
    },
  ],

  akce: [
    {
      id: "sportuj-v-parku", seed: true, featured: true,
      tag: "NÁBOR", color: "red", category: "nabor",
      title: "Sportuj v parku s VIKTORKOU",
      date: "16. 9. 2026", location: "",
      description: "Venkovní sportovní odpoledne pro děti — hry, pohyb a základy sportů pod širým nebem.",
      bullets: [
        "Venkovní sportovní odpoledne pro děti — hry, pohyb a základy nejrůznějších sportů",
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
      date: "30. 12. 2026", location: "",
      description: "Tradiční sportovní rozloučení se starým rokem — pro děti i dospělé.",
      bullets: [
        "Tradiční sportovní rozloučení se starým rokem — pro děti i dospělé, bez ohledu na výkonnost",
        "Otevřeno všem, kdo si chtějí protáhnout nohy před silvestrovskou oslavou",
        "Podrobnosti k trase, startovnému a registraci doplníme",
      ],
      photo: null,
      detailHref: "akce-silvestrovsky-beh.html",
    },
  ],

  aktuality: [
    {
      id: "otevreni-centra", seed: true,
      date: "1. 9. 2026, 14:00",
      text: "Slavnostní otevření nového centra Viktoria Fresh Dance Center v Centru Univerzity Tábor.",
      photo: null,
    },
    {
      id: "zapis-kurzy", seed: true,
      date: "1.–3. 9. 2026",
      text: "Zápis do kurzů a registrace na zkušební lekce — 1. 9. odpolední kurzy, 3. 9. celodenní kurzy. Přihlašování na e-mail nebo SMS na 607 825 318.",
      photo: null,
    },
  ],
};

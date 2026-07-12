import type { RetroTemplateResponse } from "shared/model/retro/retroTemplate.response";

const templates: RetroTemplateResponse[] = [
  {
    id: 1,
    name: "Pogodynka",
    desc: null,
    columns: [
      { name: "Słoneczny dzień", desc: "To, co nam wyszło" },
      { name: "Deszczowy dzień", desc: "Co się nie udało?" },
      {
        name: "Alert RCB",
        desc: "Jakie przeszkody napotkaliśmy?",
      },
      {
        name: "Promień zza chmur",
        desc: "Co pomogło iść na przód?",
      },
    ],
  },
  {
    id: 2,
    name: "Festiwal",
    desc: null,
    columns: [
      {
        name: "Scena główna",
        desc: "Z czego jesteśmy zadowoleni?",
      },
      {
        name: "Namiot pierwszej pomocy",
        desc: "Co się nie udało?",
      },
      {
        name: "Wróżka",
        desc: "Rzeczy, które chcielibyśmy wiedzieć nim zaczął się sprint",
      },
    ],
  },
  {
    id: 3,
    name: "Start stop continue",
    desc: null,
    columns: [
      { name: "START", desc: null },
      { name: "STOP", desc: null },
      { name: "CONTINUE", desc: null },
    ],
  },
  {
    id: 4,
    name: "KALM",
    desc: null,
    columns: [
      { name: "Keep", desc: "Coś co przynosi wartość" },
      { name: "Add", desc: "Nowy pomysł lub eksperyment" },
      {
        name: "Less",
        desc: "Rzeczy, których może być mniej",
      },
      {
        name: "More",
        desc: "Rzeczy, których może być więcej",
      },
    ],
  },
  {
    id: 5,
    name: "Glad Sad Mad",
    desc: null,
    columns: [
      { name: "Glad", desc: "Z czego jesteś zadowolony/a?" },
      { name: "Sad", desc: "Co cię smuci?" },
      { name: "Mad", desc: "Co cię denerwuje?" },
    ],
  },
  {
    id: 6,
    name: "Gorący balon",
    desc: null,
    columns: [
      {
        name: "Słoneczne niebo",
        desc: "Jakie pozytywne rzeczy na nas czekają?",
      },
      {
        name: "Gorące powietrze",
        desc: "Co pcha nas do przodu?",
      },
      {
        name: "Worki z piaskiem",
        desc: "Co ciągnie nas w dół?",
      },
      {
        name: "Burzowe chmury",
        desc: "Jakie problemy nadchodzą?",
      },
    ],
  },
  {
    id: 7,
    name: "Superbohaterowie",
    desc: null,
    columns: [
      { name: "Super-moce", desc: null },
      { name: "Pomocnicy", desc: null },
      { name: "Słabości", desc: null },
    ],
  },
  {
    id: 8,
    name: "Thumbs up thumbs down",
    desc: null,
    columns: [
      { name: "👍 Thumbs Up", desc: null },
      { name: "👎 Thumbs Down", desc: null },
    ],
  },
  {
    id: 9,
    name: "4Ls",
    desc: null,
    columns: [
      { name: "Liked", desc: "Co nam się podobało?" },
      { name: "Learned", desc: "Czego się nauczyliśmy?" },
      { name: "Lacked", desc: "Czego nam zabrakło?" },
      { name: "Longed for", desc: "Czego najbardziej chcieliśmy?" },
    ],
  },
  {
    id: 10,
    name: "Słońce i burza",
    desc: null,
    columns: [
      { name: "Słońce", desc: "Co działało dobrze?" },
      { name: "Chmury", desc: "Co było niejasne?" },
      { name: "Burza", desc: "Co sprawiło najwięcej problemów?" },
    ],
  },
  {
    id: 11,
    name: "Statek",
    desc: null,
    columns: [
      { name: "Wiatr w żagle", desc: "Co nas napędzało?" },
      { name: "Kotwica", desc: "Co nas spowalniało?" },
      { name: "Skarb", desc: "Co było największą wartością?" },
      { name: "Mielizna", desc: "Na co powinniśmy uważać?" },
    ],
  },
  {
    id: 12,
    name: "Lotnisko",
    desc: null,
    columns: [
      { name: "Start", desc: "Co dobrze wystartowało?" },
      { name: "Turbulencje", desc: "Co było trudne?" },
      { name: "Pogoda", desc: "Co nam sprzyjało?" },
      { name: "Lądowanie", desc: "Co chcemy domknąć lepiej następnym razem?" },
    ],
  },
  {
    id: 13,
    name: "Kuchnia",
    desc: null,
    columns: [
      { name: "Składniki", desc: "Co mieliśmy do dyspozycji?" },
      { name: "Przepis", desc: "Co zadziałało zgodnie z planem?" },
      { name: "Przyprawy", desc: "Co dodało smaku pracy?" },
      { name: "Spalenizna", desc: "Co się nie udało?" },
    ],
  },
  {
    id: 14,
    name: "Ogród",
    desc: null,
    columns: [
      { name: "Kwiaty", desc: "Co rozkwitło?" },
      { name: "Chwasty", desc: "Co trzeba usunąć?" },
      { name: "Nawóz", desc: "Co pomogło wzrostowi?" },
      { name: "Susza", desc: "Czego zabrakło?" },
    ],
  },
  {
    id: 15,
    name: "Laboratorium",
    desc: null,
    columns: [
      { name: "Eksperymenty", desc: "Co przetestowaliśmy?" },
      { name: "Wyniki", desc: "Co zadziałało?" },
      { name: "Wnioski", desc: "Czego się nauczyliśmy?" },
      { name: "Hipotezy", desc: "Co chcemy sprawdzić dalej?" },
    ],
  },
  {
    id: 16,
    name: "Mapa podróży",
    desc: null,
    columns: [
      { name: "Punkt startowy", desc: "Gdzie byliśmy na początku?" },
      { name: "Przystanki", desc: "Co wydarzyło się po drodze?" },
      { name: "Skróty", desc: "Co mogłoby przyspieszyć pracę?" },
      { name: "Cel", desc: "Na czym chcemy się skupić dalej?" },
    ],
  },
  {
    id: 17,
    name: "Puzzle",
    desc: null,
    columns: [
      { name: "Elementy pasujące", desc: "Co dobrze się złożyło?" },
      { name: "Brakujące kawałki", desc: "Czego zabrakło?" },
      { name: "Krawędzie", desc: "Co wymagało dopasowania?" },
      { name: "Obraz całości", desc: "Co wynieśliśmy z tej iteracji?" },
    ],
  },
  {
    id: 18,
    name: "🚀 Rakieta",
    desc: null,
    columns: [
      { name: "Start", desc: "Co odpaliło najlepiej?" },
      { name: "Paliwo", desc: "Co nas napędzało?" },
      { name: "Grawitacja", desc: "Co nas spowalniało?" },
      { name: "Orbita", desc: "Co chcemy utrzymać?" },
    ],
  },
  {
    id: 19,
    name: "🧭 Kompas",
    desc: null,
    columns: [
      { name: "Północ", desc: "Co było naszym celem?" },
      { name: "Południe", desc: "Co nas odciągało?" },
      { name: "Wschód", desc: "Co daje nam nowe kierunki?" },
      { name: "Zachód", desc: "Co warto domknąć?" },
    ],
  },
  {
    id: 20,
    name: "🎭 Teatr",
    desc: null,
    columns: [
      { name: "Scena", desc: "Co było najważniejsze?" },
      { name: "Kulisy", desc: "Co działało w tle?" },
      { name: "Aktorzy", desc: "Kto wniósł najwięcej?" },
      { name: "Kurtyna", desc: "Co chcemy zakończyć lepiej?" },
    ],
  },
  {
    id: 21,
    name: "🏖️ Plaża",
    desc: null,
    columns: [
      { name: "Piasek", desc: "Co było stabilne?" },
      { name: "Fale", desc: "Co wracało jak problem?" },
      { name: "Muszelki", desc: "Co było małe, ale cenne?" },
      { name: "Parasole", desc: "Co dawało nam ochronę?" },
    ],
  },
];

export const getRandomTemplate = (
  currentId: number | null = null,
): Promise<RetroTemplateResponse> => {
  const filteredTemplates = currentId
    ? templates.filter((template) => template.id !== currentId)
    : templates;
  const randomTemplate =
    filteredTemplates[Math.floor(Math.random() * filteredTemplates.length)];

  return Promise.resolve(randomTemplate);
};

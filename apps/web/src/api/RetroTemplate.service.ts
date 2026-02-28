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

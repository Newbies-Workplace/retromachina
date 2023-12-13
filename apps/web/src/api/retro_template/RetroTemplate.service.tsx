import {RetroTemplateResponse} from "./RetroTemplate.interface";

const templates: RetroTemplateResponse[] = [
    {
        id: 1,
        name: "Pogodynka",
        desc: null,
        columns: [
            {color: "#55b738", name: "Słoneczny dzień", desc: "To, co nam wyszło"},
            {color: "#253c9b", name: "Deszczowy dzień", desc: "Co się nie udało?"},
            {color: "#ff3636", name: "Alert RCB", desc: "Jakie przeszkody napotkaliśmy?"},
            {color: "#fffb1f", name: "Promień zza chmur", desc: "Co pomogło iść na przód?"},
        ]
    },
    {
        id: 2,
        name: "Festiwal",
        desc: null,
        columns: [
            {color: "#42d3bc", name: "Scena główna", desc: "Z czego jesteśmy zadowoleni?"},
            {color: "#ff2e6c", name: "Namiot pierwszej pomocy", desc: "Co się nie udało?"},
            {color: "#a350ff", name: "Wróżka", desc: "Rzeczy, które chcielibyśmy wiedzieć nim zaczął się sprint"},
        ]
    },
    {
        id: 3,
        name: "Start stop continue",
        desc: null,
        columns: [
            {color: "#51d232", name: "START", desc: null},
            {color: "#ff004c", name: "STOP", desc: null},
            {color: "#e7fa69", name: "CONTINUE", desc: null},
        ]
    },
    {
        id: 4,
        name: "KALM",
        desc: null,
        columns: [
            {color: "#57c796", name: "Keep", desc: "Coś co przynosi wartość"},
            {color: "#66ff00", name: "Add", desc: "Nowy pomysł lub eksperyment"},
            {color: "#ff6e39", name: "Less", desc: "Rzeczy, których może być mniej"},
            {color: "#44d2e7", name: "More", desc: "Rzeczy, których może być więcej"},
        ]
    },
    {
        id: 5,
        name: "Glad Sad Mad",
        desc: null,
        columns: [
            {color: "#579cc7", name: "Glad", desc: "Z czego jesteś zadowolony/a?"},
            {color: "#ffa42e", name: "Sad", desc: "Co cię smuci?"},
            {color: "#ff6e39", name: "Mad", desc: "Co cię denerwuje?"},
        ]
    },
    {
        id: 6,
        name: "Gorący balon",
        desc: null,
        columns: [
            {color: "#fff32b", name: "Słoneczne niebo", desc: "Jakie pozytywne rzeczy na nas czekają?"},
            {color: "#67d0ca", name: "Gorące powietrze", desc: "Co pcha nas do przodu?"},
            {color: "#b00a68", name: "Worki z piaskiem", desc: "Co ciągnie nas w dół?"},
            {color: "#00039f", name: "Burzowe chmury", desc: "Jakie problemy nadchodzą?"},
        ]
    },
    {
        id: 7,
        name: "Superbohaterowie",
        desc: null,
        columns: [
            {color: "#ff2b5c", name: "Super-moce", desc: null},
            {color: "#423f85", name: "Pomocnicy", desc: null},
            {color: "#330d69", name: "Słabości", desc: null},
        ]
    },
]

export const getRandomTemplate = (currentId: number | null = null): Promise<RetroTemplateResponse> => {
    const filteredTemplates = currentId
        ? templates.filter(template => template.id !== currentId)
        : templates
    const randomTemplate = filteredTemplates[Math.floor(Math.random() * filteredTemplates.length)]

    return Promise.resolve(randomTemplate)
}
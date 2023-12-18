export const usePlural = (
    count: number,
    forms: {
        one: string
        few: string
        other: string
    }
) => {
    return count === 1
        ? forms.one
        : count % 10 >= 2 && count % 10 <= 4 &&
        (count % 100 < 10 || count % 100 >= 20)
            ? forms.few
            : forms.other
}
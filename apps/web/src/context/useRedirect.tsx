import Cookies from 'js-cookie'
import dayjs from "dayjs";

const REDIRECT_COOKIE_NAME = "@redirect"

export const setRedirectPath = (path: string | null) => {
    let value = path
    if (path === '/') {
        value = null
    }

    Cookies.remove(REDIRECT_COOKIE_NAME)

    if (value) {
        Cookies.set(
            REDIRECT_COOKIE_NAME,
            value,
            {
                expires: dayjs()
                    .add(5, 'm')
                    .toDate()
            },
        )
    }
}

export const getRedirectPath = (): string | null => {
    return Cookies.get(REDIRECT_COOKIE_NAME) ?? null
}
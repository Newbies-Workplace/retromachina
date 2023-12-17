export interface AuthParams {
    code: string,
    scope: string,
    authUser: string,
    prompt: string,
    state: string,
}

export interface AuthResponse {
    access_token: string
}
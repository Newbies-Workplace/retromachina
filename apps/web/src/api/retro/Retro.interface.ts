export interface RetroResponse {
    id: string,
    team_id: string,
    date: string,
    is_running: boolean
}

export interface RetroCreateRequest {
    teamId: string
    columns: {
        id: string
        color: string
        name: string
        desc: string | null
    }[]
}
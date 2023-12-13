export interface RetroTemplateResponse {
    id: number
    name: string
    desc: string | null
    columns: {
      color: string
      name: string
      desc: string | null
    }[]
}
export interface RetroCreateRequest {
  teamId: string
  columns: {
    id: string
    color: string
    name: string
    desc: string | null
  }[]
}
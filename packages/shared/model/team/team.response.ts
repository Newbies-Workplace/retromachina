export interface TeamResponse {
  id: string;
  name: string;
  owner_id: string;
  invite_key?: string;
  active_retrospective_id?: string;
}

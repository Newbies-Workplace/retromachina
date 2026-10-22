export interface TeamResponse {
  id: string;
  name: string;
  slug: string;
  organization_id: string | null;
  invite_key?: string;
}

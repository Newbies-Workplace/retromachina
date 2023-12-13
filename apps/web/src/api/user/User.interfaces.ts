export interface UserResponse {
  id: string;
  nick: string;
  email: string;
  avatar_link: string;
  teams?: {
    name: string;
    id: string;
    owner_id: string;
    role: Role;
  }[];
}

export type Role = "ADMIN" | "USER";

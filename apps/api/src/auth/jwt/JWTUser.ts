import { Role } from '@prisma/client';

export type JWTUser = {
  id: string;
  nick: string;
  email: string;
  google_id: string;
  teams: {
    id: string;
    role: Role;
  }[];
};

export type Token = {
  user: JWTUser;
};
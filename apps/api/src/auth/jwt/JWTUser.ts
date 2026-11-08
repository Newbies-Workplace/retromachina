import { Role } from "generated/prisma/client";

export type JWTUser = {
  auth?: import("../session/access-token.service").AccessClaims;
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

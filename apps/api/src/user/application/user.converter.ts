import type { Role, User } from "@prisma/client";
import type {
  UserInTeamResponse,
  UserResponse,
} from "shared/model/user/user.response";

export const toUserResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    nick: user.nick,
    email: user.email,
    avatar_link: user.avatar_link,
  };
};

export const toUserInTeamResponse = (
  user: User,
  role: Role,
): UserInTeamResponse => {
  return {
    id: user.id,
    nick: user.nick,
    email: user.email,
    avatar_link: user.avatar_link,
    role: role,
  };
};

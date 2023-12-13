import { User } from '@prisma/client';
import { UserResponse } from './model/user.response';

export const toUserResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    nick: user.nick,
    email: user.email,
    avatar_link: user.avatar_link,
  }
}
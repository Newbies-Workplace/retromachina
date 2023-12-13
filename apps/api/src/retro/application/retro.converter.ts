import { RetroResponse } from './model/retro.response';
import {Retrospective} from '@prisma/client';

export const toRetroResponse = (retro: Retrospective): RetroResponse => {
  return {
    id: retro.id,
    team_id: retro.team_id,
    date: retro.date,
    is_running: retro.is_running,
  }
}
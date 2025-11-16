import { Retrospective } from "generated/prisma/client";
import { RetroResponse } from "shared/model/retro/retro.response";

export const toRetroResponse = (retro: Retrospective): RetroResponse => {
  return {
    id: retro.id,
    team_id: retro.team_id,
    date: retro.date,
    is_running: retro.is_running,
  };
};

import {useEffect} from "react";
import {useUser} from "@/context/user/UserContext.hook";
import {TeamState, useTeamStore} from "@/store/useTeamStore";

export const useTeamData = (teamId: string | null): TeamState => {
  const {user} = useUser();

  const {teams, fetchTeamData} = useTeamStore()

  useEffect(() => {
    if (teamId && user) {
      fetchTeamData(teamId);
    }
  }, [teamId, user, fetchTeamData]);

  return teams[teamId ?? ""] || {state: "loading", team: null, users: [], invites: []};
}

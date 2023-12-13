import {useUser} from "./user/UserContext.hook";
import {Role} from "../api/user/User.interfaces";

interface TeamRoleResult {
    role: Role | null
    isAdmin: boolean
}

export const useTeamRole = (teamId: string): TeamRoleResult => {
    const { user } = useUser();

    const role = user?.teams.find(team => team.id === teamId)?.role || null;

    return {
        role: role,
        isAdmin: role === 'ADMIN',
    }
}
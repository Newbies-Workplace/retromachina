import {useUser} from "./user/UserContext.hook";
import {UserRole} from "shared/model/user/user.role";

interface TeamRoleResult {
    role: UserRole | null
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

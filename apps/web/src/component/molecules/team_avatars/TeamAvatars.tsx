import React from "react";
import styles from './TeamAvatars.module.scss'
import {Avatar} from '../../atoms/avatar/Avatar'

interface TeamAvatarsProps {
    users: {
        id: string
        isActive: boolean,
        avatar_link: string
    }[]
}

export const TeamAvatars: React.FC<React.PropsWithChildren<TeamAvatarsProps>> = ({users})=>{
    const activeUsers = users.filter(user => user.isActive)
    const inactiveUsers = users.filter(user => !user.isActive)

    return (
        <div className={styles.wrapper}>
            {activeUsers.map((user) =>
                <Avatar
                    key={user.id}
                    className={styles.avatar}
                    url={user.avatar_link} />
            )}
            {inactiveUsers.map((user) =>
                <Avatar
                    key={user.id}
                    className={styles.avatar}
                    inactive
                    url={user.avatar_link} />
            )}
        </div>
    );
}

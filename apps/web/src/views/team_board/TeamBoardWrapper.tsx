import React from "react";
import {BoardContextProvider} from "../../context/board/BoardContext";
import {Navigate, useParams} from "react-router";

export const TeamBoardWrapper: React.FC<React.PropsWithChildren> = ({children}) => {
    const { teamId } = useParams<{teamId: string}>();
    if (!teamId) {
        return <Navigate to={"/"}/>
    }

    return (
        <BoardContextProvider teamId={teamId}>
            {children}
        </BoardContextProvider>
    )
}
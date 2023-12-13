import React, {useEffect} from "react";
import {RetroContextProvider} from "../../context/retro/RetroContext";
import {Navigate, useNavigate, useParams} from "react-router";
import {getRetroByRetroId} from "../../api/retro/Retro.service";

export const RetroWrapper: React.FC<React.PropsWithChildren> = ({children}) => {
    const navigate = useNavigate()
    const { retroId } = useParams<{retroId: string}>();
    if (!retroId) {
        return <Navigate to={"/"}/>
    }

    useEffect(() => {
        if (retroId) {
            getRetroByRetroId(retroId)
                .then(retro => {
                    if (!retro.is_running) {
                        navigate("summary")
                    }
                })
        }
    }, [retroId])

    return (
        <RetroContextProvider retroId={retroId}>
            {children}
        </RetroContextProvider>
    )
}
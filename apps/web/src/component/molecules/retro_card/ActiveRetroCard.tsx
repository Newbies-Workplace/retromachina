import React from "react"
import styles from "./RetroCard.module.scss"
import {Button} from "../../atoms/button/Button";

interface RetroCardProps{
    onClick(): void
}

export const ActiveRetroCard: React.FC<RetroCardProps> = ({onClick}) => {
    return (
        <Button className={styles.wrapper} onClick={onClick}>
            Retro właśnie trwa
        </Button>
    )
}
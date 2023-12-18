import React from "react"
import style from './ColumnHeader.module.scss'

interface ColumnHeaderProps{
    color: string,
    description?: string
    header: string
    right?: React.ReactNode
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({color, description, header, right}) => {
    return (
        <div className={style.wrapper}>
            <div className={style.top}>
                <div className={style.title}>
                    <div className={style.boxWrapper}>
                        <div className={style.box} style={{backgroundColor: color}} />
                    </div>

                    <span>{header}</span>
                </div>


                {right}
            </div>

            {description !== undefined &&
                <div className={style.description}>
                    <span>{description}</span>
                </div>
            }
        </div>
    )
}
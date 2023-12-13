import React from 'react'
import styles from './ColumnCreate.module.scss'
import DeleteIcon from '../../../assets/icons/delete-icon.svg'
import {Input} from '../../atoms/input/Input'
import {ColorPicker} from '../color_picker/ColorPicker'

export interface ColumnCreateProps {
    color: string,
    name: string,
    desc: string
    onChange: (column: {
        color: string,
        name: string,
        desc: string | null,
    }) => void
    onDelete: () => void
    withDescription?: boolean
}

export const ColumnCreate: React.FC<ColumnCreateProps> = ({color, name, desc, onChange, onDelete, withDescription = false}) => {
    return (
        <div className={styles.wrapper} >
            <div className={styles.topBar}>
                <ColorPicker
                    color={color}
                    onChange={(color) => {
                        onChange({
                            color: color,
                            name: name,
                            desc: desc
                        })
                    }}/>

                <Input
                    maxLength={35}
                    value={name}
                    setValue={(name) => {
                        onChange({
                            color: color,
                            name: name,
                            desc: desc
                        })
                    }}
                    placeholder="Nazwa Kolumny"
                    className={styles.name}/>

                <DeleteIcon onClick={onDelete} className={styles.delete}/>
            </div>

            {withDescription &&
                <Input
                    multiline
                    value={desc}
                    setValue={(desc) => onChange({
                        color: color,
                        name: name,
                        desc: desc
                    })}
                    placeholder="Opis"/>
            }
        </div>
    )
}
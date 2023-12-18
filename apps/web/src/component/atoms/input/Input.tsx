import React, { KeyboardEventHandler } from "react";
import styles from './Input.module.scss';
import cs from "classnames";

interface InputProps {
    style?: any
    className?: string
    value: string
    setValue: (value: string) => void
    placeholder?: string
    multiline?: boolean
    type?: React.HTMLInputTypeAttribute,
    required?: boolean,
    right?: React.ReactNode
    onKeyDown?: KeyboardEventHandler<any> | undefined
    maxLength?: number
}

export const Input: React.FC<InputProps> = ({className, value, setValue, placeholder, onKeyDown, multiline = false, type, right, required, style, maxLength}) => {
    return (
        <div className={styles.wrapper} style={style}>
            {multiline
                ? (
                    <textarea
                        style={style}
                        className={cs(styles.multiline, className)}
                        value={value}
                        required={required}
                        placeholder={placeholder}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                )
                : (
                    <input
                        maxLength={maxLength}
                        style={style}
                        className={cs(styles.oneline, className)}
                        value={value}
                        type={type}
                        required={required}
                        placeholder={placeholder}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={onKeyDown}
                    />
                )
            }

            {right !== undefined &&
                <div className={styles.rightWrapper}>
                    {right}
                </div>
            }
        </div>
    )
}
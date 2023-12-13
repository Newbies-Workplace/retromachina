import styles from './Avatar.module.scss';
import React from 'react';
import cs from "classnames";

interface AvatarProps {
    className?: string
    size?: number
    style?: React.CSSProperties
    inactive?: boolean
    url: any
}

export const Avatar : React.FC<AvatarProps> = (
    {
        inactive = false,
        size = 40,
        style,
        url,
        className,
    }
) => {
    return (
        <div
            style={style}
            className={className}>
            <img
                referrerPolicy="no-referrer"
                src={url}
                style={{
                    width: size,
                    height: size,
                    minWidth: size,
                    minHeight: size,
                }}
                className={cs(
                    styles.circle,
                    {[styles.inactive]: inactive},
                    styles.photo
                )}/>
        </div>
    );
}
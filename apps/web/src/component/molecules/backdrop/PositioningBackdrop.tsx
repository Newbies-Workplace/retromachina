import React, {useEffect, useRef, useState} from "react";
import styles from "./Backdrop.module.scss"
import {Portal} from "react-portal";

interface PositioningBackdropProps {
    onDismiss?: () => void
    visible?: boolean
    children: React.ReactNode
}

type Position = {
    x: number
    y: number
    width: number
    height: number
}

export const PositioningBackdrop: React.FC<PositioningBackdropProps> = (
    {
        children,
        visible = true,
        onDismiss = () => {},
    }
) => {
    const boxRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<Position>()

    useEffect(() => {
        window.addEventListener('resize', updateElementPosition);

        return () => {
            window.removeEventListener('resize', updateElementPosition);
        };
    }, []);

    useEffect(() => {
        updateElementPosition()
    }, [visible])

    const updateElementPosition = () => {
        const ref = boxRef.current

        if (ref) {
            const viewportOffset = ref.getBoundingClientRect();
            const newPos: Position = {
                x: viewportOffset.left,
                y: viewportOffset.top,
                height: ref.clientHeight,
                width: ref.clientWidth,
            }

            setPos(newPos)
        }
    }

    return (
        <>
            {visible && pos &&
                <Portal>
                    <div className={styles.backdrop} onClick={onDismiss} />

                    <div style={{
                        position: 'absolute',
                        top: pos.y,
                        left: pos.x,
                        width: pos.width,
                        height: pos.height,
                    }}>
                        {children}
                    </div>
                </Portal>
            }

            <div ref={boxRef}>
                {visible && pos
                    ? <div style={{
                        display: 'flex',
                        width: pos.width,
                        height: pos.height,
                    }}/>
                    : children
                }
            </div>
        </>
    )
}
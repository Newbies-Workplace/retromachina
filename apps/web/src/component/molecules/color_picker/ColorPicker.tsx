import React, { useCallback, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import styles from './ColorPicker.module.scss'
import useClickOutside from "../../../context/useClickOutside";
import EditIconSvg from "../../../assets/icons/edit-icon.svg"

interface PopoverPickerProps{
    color: string,
    onChange: (color: string) => void,

}
export const ColorPicker: React.FC<PopoverPickerProps> = ({ color , onChange }) => {
    const popover = useRef<any>();
    const [isOpen, toggle] = useState(false);
    const close = useCallback(() => toggle(false), []);
    const presetColors = ["#FFFF00", "#FF0000", "#008000" , "#000080", "#800080"]

    useClickOutside(popover, close);

    return (
        <div className={styles.picker}>
            <div
                className={styles.swatch}
                style={{ backgroundColor: color }}
                onClick={() => toggle(true)}
            >
                <EditIconSvg width={24} height={24} opacity={0.5}/>
            </div>

            {isOpen && (
                <>
                    <div className={styles.popover} ref={popover}>
                        <HexColorPicker color={color} onChange={onChange}/>
                        <div className={styles.picker__swatches}>
                            {presetColors.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    className={styles.picker__swatch}
                                    style={{ background: presetColor }}
                                    onClick={() => onChange(presetColor)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


import { PencilIcon } from "lucide-react";
import React, { createRef, useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import useClickOutside from "../../../context/useClickOutside";

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}
export const ColorPicker: React.FC<PopoverPickerProps> = ({
  color,
  onChange,
}) => {
  const popover = createRef<HTMLDivElement>();
  const [isOpen, toggle] = useState(false);
  const close = useCallback(() => toggle(false), []);
  const presetColors = [
    "#FF0000",
    "#FFFF00",
    "#08d508",
    "#3be7ea",
    "#0000af",
    "#b400b4",
  ];

  useClickOutside(popover, close);

  return (
    <div className={"relative size-[34px]"}>
      <div
        className={
          "flex items-center justify-center size-[34px] rounded-lg border cursor-pointer"
        }
        style={{ backgroundColor: color }}
        onClick={() => toggle(true)}
      >
        <PencilIcon className={"size-4 opacity-50"} />
      </div>

      {isOpen && (
        <div
          className={
            "absolute top-[calc(100%+4px)] rounded-xl border overflow-hidden"
          }
          ref={popover}
        >
          <HexColorPicker color={color} onChange={onChange} />
          <div
            className={
              "flex flex-row justify-evenly bg-background-500 p-2 pt-3 -m-1"
            }
          >
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className={"size-6 cursor-pointer rounded"}
                style={{ background: presetColor }}
                onClick={() => onChange(presetColor)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

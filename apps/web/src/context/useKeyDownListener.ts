import {useEffect, useState} from "react";

export const useKeyDownListener = (key: string): boolean => {
  const [keyDown, setKeyDown] = useState(false)

  useEffect(() => {
    const keyUpListener = (e: KeyboardEvent) => {
      if (e.key === key) {
        setKeyDown(false)
      }
    }

    const keyDownListener = (e: KeyboardEvent) => {
      if (e.key === key) {
        setKeyDown(true)
      }
    }

    document.addEventListener("keydown", keyDownListener)
    document.addEventListener("keyup", keyUpListener)

    return () => {
      document.removeEventListener("keyup", keyUpListener)
      document.removeEventListener("keydown", keyDownListener)
    };
  }, []);

  return keyDown
};

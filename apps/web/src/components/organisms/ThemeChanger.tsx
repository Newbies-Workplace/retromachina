import React, { useEffect } from "react";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export const ThemeChanger: React.FC = () => {
  const theme = usePreferencesStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return null;
};

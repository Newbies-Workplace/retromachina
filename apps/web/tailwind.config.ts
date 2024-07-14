import type { Config } from "tailwindcss";

const colors = {
  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    500: "#D9D9D9",
    600: "#bdbdbd",
  },
  red: {
    500: "#DC6E47",
    600: "#b75939",
  },
  primary: {
    500: "#73BDA8",
    600: "#5e9b8a",
  },
  background: {
    50: "#F4F2E6",
    100: "#f8e2c3",
    500: "#EBD3A8",
  },
  secondary: {
    400: "#9c7556",
    500: "#946847",
  },
};

const config: Config = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    colors: colors,
    extend: {
      fontFamily: {
        "jetbrains-mono": ["JetBrains Mono", "monospace"],
        "harlow-solid-italic": ["Harlow Solid Italic", "cursive"],
      },
      animation: {
        "timer-blink": "timerBlink 1s infinite",
      },
      keyframes: {
        timerBlink: {
          "0%, 100%": {
            borderColor: colors.red[500],
            backgroundColor: colors.background[50],
            color: colors.red[500],
          },
          "50%": {
            borderColor: colors.background[50],
            backgroundColor: colors.red[500],
            color: colors.background[50],
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;

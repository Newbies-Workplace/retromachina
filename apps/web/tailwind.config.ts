import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      white: "#FFFFFF",
      black: "#000000",
      gray: {
        500: "#D9D9D9",
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
        500: "#EBD3A8",
      },
      secondary: {
        500: "#946847",
      },
    },
    extend: {
      fontFamily: {
        "jetbrains-mono": ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

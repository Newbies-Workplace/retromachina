import type { Preview } from "@storybook/react-vite";
import "../src/App.css";
import "./../src/index.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      options: {
        light: {
          name: "light",
          value: "#F4F2E6",
        },

        dark: {
          name: "dark",
          value: "#444444",
        },
      },
    },
  },

  tags: ["autodocs"],

  initialGlobals: {
    backgrounds: {
      value: "light",
    },
  },
};

export default preview;

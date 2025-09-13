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
      default: "light",
      values: [
        {
          name: "light",
          value: "#F4F2E6",
        },
        {
          name: "dark",
          value: "#444444",
        },
      ],
    },
  },

  tags: ["autodocs"]
};

export default preview;

import type { Preview } from "@storybook/react";
import './../src/App.module.scss';
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
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#F4F2E6',
        },
        {
          name: 'dark',
          value: '#444444',
        },
      ]
    }
  },
};

export default preview;

// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const require = createRequire(import.meta.url);
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  staticDirs: [{ from: "public", to: "assets" }],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-mcp"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
};
export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

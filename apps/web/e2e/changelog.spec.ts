import { expect, test } from "@playwright/test";
import { releases } from "../src/changelog/releases";
import {
  DISABLED_KEY,
  useChangelogStore,
  VERSION_KEY,
} from "../src/store/useChangelogStore";
import { APP_VERSION } from "../src/utils/version";

test.describe("changelog initialization", () => {
  const originalReleases = [...releases];

  test.beforeEach(() => {
    const storage = new Map<string, string>([[VERSION_KEY, "0.1.0"]]);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    useChangelogStore.setState({
      initialized: false,
      open: false,
      disabled: false,
      history: false,
      previous: null,
    });
  });

  test.afterEach(() => {
    releases.splice(0, releases.length, ...originalReleases);
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  test("updates stored version without opening when there are no newer entries", () => {
    releases.splice(0, releases.length, {
      version: "0.1.0",
      title: "Previous release",
      changes: ["Previous change"],
    });

    useChangelogStore.getState().initialize();

    expect(useChangelogStore.getState().open).toBe(false);
    expect(localStorage.getItem(VERSION_KEY)).toBe(APP_VERSION);
  });

  test("opens when an entry was added since the stored version", () => {
    releases.splice(0, releases.length, {
      version: APP_VERSION,
      title: "New release",
      changes: ["New change"],
    });

    useChangelogStore.getState().initialize();

    expect(useChangelogStore.getState().open).toBe(true);
    expect(localStorage.getItem(VERSION_KEY)).toBe(APP_VERSION);
  });

  test("respects disabled changelog while updating the stored version", () => {
    localStorage.setItem(DISABLED_KEY, "true");

    useChangelogStore.getState().initialize();

    expect(useChangelogStore.getState().open).toBe(false);
    expect(localStorage.getItem(VERSION_KEY)).toBe(APP_VERSION);
  });
});

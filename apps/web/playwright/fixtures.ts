import { test as base, chromium, type Page } from "@playwright/test";

export const firstAuthFile = "playwright/.auth/first-user.json";
export const secondAuthFile = "playwright/.auth/second-user.json";

class FirstUserPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

class SecondUserPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

type MyFixtures = {
  firstUser: FirstUserPage;
  secondUser: SecondUserPage;
  setupBrowserPage: Page;
};

export * from "@playwright/test";
export const test = base.extend<MyFixtures>({
  firstUser: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: firstAuthFile });
    const adminPage = new FirstUserPage(await context.newPage());
    await use(adminPage);
    await context.close();
  },
  secondUser: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: secondAuthFile });
    const userPage = new SecondUserPage(await context.newPage());
    await use(userPage);
    await context.close();
  },

  setupBrowserPage: async ({ browser }, use) => {
    // Uncomment when using Chrome with remote debugging enabled for authentication setup
    // const cdpBrowser = await chromium.connectOverCDP("http://localhost:9222");
    // await use(cdpBrowser.contexts()[0].pages()[0]);
    // await cdpBrowser.close();

    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

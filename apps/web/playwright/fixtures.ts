import { test as base, type Page } from "@playwright/test";

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
});

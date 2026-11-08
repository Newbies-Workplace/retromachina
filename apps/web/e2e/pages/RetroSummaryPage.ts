import type { Locator, Page } from "@playwright/test";

export class RetroSummaryPage {
  readonly page: Page;
  readonly headerLocator: Locator;
  readonly unassignedHeaderLocator: Locator;
  readonly noTasksLocator: Locator;
  readonly backButtonLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerLocator = page.getByTestId("summary-header");
    this.unassignedHeaderLocator = page.getByText("Nieprzypisane zadania");
    this.noTasksLocator = page.getByText("Brak zadań");
    this.backButtonLocator = page.getByRole("button", {
      name: "Powrót do listy zadań",
    });
  }
}

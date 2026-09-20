import { expect, type Locator, type Page } from "@playwright/test";

export class PokerPage {
  readonly page: Page;

  readonly playersLocator: Locator;
  readonly revealedCardsLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.playersLocator = this.page.getByTestId("poker-player");
    this.revealedCardsLocator = this.page.getByTestId(
      "poker-player-revealed-card",
    );
  }

  async goto(teamId: string) {
    await this.page.goto(`/${teamId}/poker`);
    await expect(this.page).toHaveURL(new RegExp(`/${teamId}/poker$`));
  }

  card(card: string) {
    return this.page.getByTestId(`poker-card-${card}`);
  }

  cardVoteCounter(card: string) {
    return this.page.getByTestId(`poker-card-${card}-vote-count`);
  }

  async selectCard(card: string) {
    await this.card(card).click();
    await expect(this.card(card)).toHaveAttribute("aria-pressed", "true");
  }

  async unselectCard(card: string) {
    await this.card(card).click();
    await expect(this.card(card)).toHaveAttribute("aria-pressed", "false");
  }

  async revealCards() {
    await this.page.getByRole("button", { name: "Odkryj karty" }).click();
  }

  async expectRevealedCards(cards: string[]) {
    await expect(this.revealedCardsLocator).toHaveCount(cards.length);

    for (const card of cards) {
      await expect(
        this.revealedCardsLocator.filter({ hasText: card }),
      ).toHaveCount(1);
    }
  }

  async clearTable() {
    await this.page.getByRole("button", { name: "Wyczyść stół" }).click();
  }

  async switchDeck(deckName: "Talia koszulkowa" | "Talia zwykła") {
    await this.page.getByTestId("deck-picker").click();
    await this.page.getByRole("button", { name: deckName }).click();
    await expect(this.page.getByTestId("deck-picker")).toContainText(deckName);
  }
}

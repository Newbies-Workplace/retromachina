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

  get deckPicker() {
    return this.page.getByTestId("deck-picker");
  }

  /**
   * The deck tile in the open picker. Its accessible name starts with the deck
   * name, unlike the "Edytuj talię …" / "Usuń talię …" buttons next to it.
   */
  deckOption(deckName: string) {
    return this.page.getByRole("button", {
      name: new RegExp(`^${escapeRegExp(deckName)}`),
    });
  }

  /** Opens the picker and waits until the team's decks are loaded from the API. */
  async openDeckPicker() {
    const decksLoaded = this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        /\/poker_decks$/.test(new URL(response.url()).pathname) &&
        response.ok(),
    );
    await this.deckPicker.click();
    await decksLoaded;
  }

  async switchDeck(deckName: string) {
    await this.deckPicker.click();
    await this.deckOption(deckName).click();
    await expect(this.deckPicker).toContainText(deckName);
  }

  /** Opens the "new deck" editor and fills it in without saving. */
  async fillNewDeck(name: string, cards: string) {
    await this.deckPicker.click();
    await this.page.getByTestId("deck-create").click();
    await this.page.getByTestId("deck-name").fill(name);
    await this.page.getByTestId("deck-cards").fill(cards);
  }

  async saveDeck() {
    await this.page.getByTestId("deck-save").click();
  }

  /** Creates a team deck from the picker; the room switches to it right away. */
  async createDeck(name: string, cards: string) {
    await this.fillNewDeck(name, cards);
    await this.saveDeck();
    await expect(this.deckPicker).toContainText(name);
  }

  async editDeck(name: string, newCards: string) {
    await this.page.getByTestId("deck-picker").click();
    await this.page
      .getByRole("button", { name: `Edytuj talię ${name}` })
      .click();
    await this.page.getByTestId("deck-cards").fill(newCards);
    await this.page.getByTestId("deck-save").click();
    await this.page.keyboard.press("Escape");
  }

  get deckDeleteConfirmation() {
    return this.page.getByRole("dialog", { name: "Usunąć talię?" });
  }

  /** Opens the picker and asks to delete a deck, leaving the confirmation open. */
  async requestDeckDeletion(name: string) {
    await this.page.getByTestId("deck-picker").click();
    await this.page.getByRole("button", { name: `Usuń talię ${name}` }).click();
    await expect(this.deckDeleteConfirmation).toBeVisible();
  }

  async deleteDeck(name: string) {
    await this.requestDeckDeletion(name);
    await this.page.getByTestId("deck-delete-confirm").click();
    await expect(this.deckDeleteConfirmation).not.toBeVisible();
    await expect(
      this.page.getByRole("button", { name: `Usuń talię ${name}` }),
    ).not.toBeVisible();
    await this.page.keyboard.press("Escape");
  }
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

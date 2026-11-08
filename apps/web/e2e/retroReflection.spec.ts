import { expect, test } from "../playwright/fixtures";
import {
  createRetro,
  createTeamWithMember,
  joinRetro,
} from "./helpers/retroSetup";
import { ReflectionPage } from "./pages/ReflectionPage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

test.describe("reflection", () => {
  test.describe.configure({ timeout: 90_000 });
  let owner: ReflectionPage;
  let member: ReflectionPage;

  test.beforeEach(async ({ firstUser, secondUser }) => {
    const { teamName } = await createTeamWithMember(
      firstUser.page,
      secondUser.page,
    );
    const retroId = await createRetro(firstUser.page, teamName);
    await joinRetro(secondUser.page, retroId);
    owner = new ReflectionPage(firstUser.page);
    member = new ReflectionPage(secondUser.page);
  });

  test("creates a card and ignores blank text", async () => {
    await owner.submitCard("   ");
    await expect(owner.cardsLocator).toHaveCount(0);

    await owner.createCard("My first card");
    await expect(owner.cardsInColumn(0)).toHaveCount(1);
    await expect(owner.cardInput(0)).toHaveValue("");
  });

  test("edited card text persists after reload", async () => {
    await owner.createCard("Before edit");
    await owner.editCard("Before edit", "After edit");
    await expect(owner.cardWithText("After edit")).toBeVisible();

    await owner.page.reload();
    await expect(owner.cardWithText("After edit")).toBeVisible();
    await expect(owner.cardWithText("Before edit")).toHaveCount(0);
  });

  // Dismissing the editor (Escape or clicking outside) saves the text by
  // design: CardContent.handleEditDismiss calls onSave.
  test("escape closes the editor and keeps the edited text", async () => {
    await owner.createCard("Before escape");
    const card = owner.cardWithText("Before escape");
    await card.getByTestId("editable-text").click();
    const input = owner.page.getByTestId("editable-text-input");
    await input.fill("After escape");
    await input.press("Escape");

    await expect(input).toHaveCount(0);
    await expect(owner.cardWithText("After escape")).toHaveCount(1);

    await owner.page.reload();
    await expect(owner.cardWithText("After escape")).toHaveCount(1);
    await expect(owner.cardWithText("Before escape")).toHaveCount(0);
  });

  test("deletes a card", async () => {
    await owner.createCard("To delete");
    await owner.deleteCard("To delete");
    await expect(owner.cardsLocator).toHaveCount(0);

    await owner.page.reload();
    await expect(owner.cardInput(0)).toBeVisible();
    await expect(owner.cardsLocator).toHaveCount(0);
  });

  test("other users do not see card text but see the team counter", async () => {
    await expect(member.teamCounter(0)).toHaveText(/^0 kartek zespołu$/);
    await owner.createCard("Secret card");

    await expect(member.teamCounter(0)).toHaveText(/^1 kartka zespołu$/);
    await expect(member.cardsLocator).toHaveCount(0);
    await expect(member.page.getByText("Secret card")).toHaveCount(0);

    await member.createCard("Member card");
    await expect(owner.teamCounter(0)).toHaveText(/^2 kartki zespołu$/);
    await expect(owner.page.getByText("Member card")).toHaveCount(0);
    await expect(owner.cardsLocator).toHaveCount(1);
  });

  test("other users see a typing indicator", async () => {
    await expect(member.typingIndicator(0)).toHaveCount(0);
    await owner.typeCardText("typing...");
    await expect(member.typingIndicator(0)).toBeVisible();
    // The indicator clears a few seconds after typing stops
    await expect(member.typingIndicator(0)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test("ready toggle updates progress and resets on stage change", async () => {
    await owner.createCard("Some card");

    await expect(owner.readyButtonLocator).toHaveAttribute(
      "aria-label",
      "Oznacz jako gotowy",
    );
    await owner.expectReadyPercentage(0);

    await owner.toggleReady();
    await expect(owner.readyButtonLocator).toHaveAttribute(
      "aria-label",
      "Cofnij gotowość",
    );
    await owner.expectReadyPercentage(50);
    await member.expectReadyPercentage(50);

    await owner.toggleReady();
    await expect(owner.readyButtonLocator).toHaveAttribute(
      "aria-label",
      "Oznacz jako gotowy",
    );
    await owner.expectReadyPercentage(0);

    await owner.toggleReady();
    await owner.expectReadyPercentage(50);
    await owner.gotoStage("group");
    await expect(member.page).toHaveURL(/\/group/);
    await expect(owner.readyButtonLocator).toHaveAttribute(
      "aria-label",
      "Oznacz jako gotowy",
    );
    await owner.expectReadyPercentage(0);
    await member.expectReadyPercentage(0);
  });

  test("next stage is disabled without cards", async () => {
    await expect(owner.nextStageButtonLocator).toBeDisabled();
    await owner.createCard("Enable it");
    await expect(owner.nextStageButtonLocator).toBeEnabled();
    await owner.deleteCard("Enable it");
    await expect(owner.nextStageButtonLocator).toBeDisabled();
  });

  test("a member cannot change stage or edit columns", async () => {
    await expect(owner.nextStageButtonLocator).toBeVisible();
    await expect(member.nextStageButtonLocator).toHaveCount(0);
    await expect(member.prevStageButtonLocator).toHaveCount(0);

    const column = member.column(0);
    const title = column.getByTestId("column-title");
    await expect(title).toHaveText("First");
    await title.click();
    await expect(column.getByTestId("column-title-input")).toHaveCount(0);

    await column.getByTestId("column-description").click();
    await expect(column.getByTestId("column-description-input")).toHaveCount(0);
    await expect(title).toHaveText("First");
  });
});

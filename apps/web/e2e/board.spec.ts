import { randomUUID as uuid } from "node:crypto";
import { expect, test } from "../playwright/fixtures";
import { createTeam, createTeamWithMember } from "./helpers/retroSetup";
import { BoardPage } from "./pages/BoardPage";
import { HomePage } from "./pages/HomePage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

test("empty task is cancelled instead of saved", async ({ firstUser }) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();

  await board.column(0).getByTestId("board-add-task").click();
  const input = firstUser.page.getByTestId("editable-text-input");
  await expect(input).toBeFocused();
  await input.fill("   ");
  await input.press("Enter");

  await expect(board.cards).toHaveCount(0);
});

test("can create, edit and delete a task", async ({ firstUser }) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();
  const text = uuid();
  const edited = uuid();

  await board.addTask(0, text);
  await expect(board.column(0).getByText(text)).toBeVisible();

  await firstUser.page.reload();
  await expect(board.card(text)).toBeVisible();

  await board.editTask(text, edited);
  await expect(board.card(edited)).toBeVisible();

  await firstUser.page.reload();
  await expect(board.card(edited)).toBeVisible();
  await expect(board.card(text)).toHaveCount(0);

  await board.deleteTask(edited);
  await expect(board.cards).toHaveCount(0);

  await firstUser.page.reload();
  await board.waitForLoaded();
  await expect(board.cards).toHaveCount(0);
});

test("can change the owner of a task and unassign it", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();
  const text = uuid();
  await board.addTask(0, text);

  // a card is briefly rendered twice while it animates after an update
  const author = board.card(text).getByTestId("card-author").last();
  await expect(author).toContainText("E2E First");

  await board.setOwner(text, "E2E Second");
  await expect(author).toContainText("E2E Second");

  await firstUser.page.reload();
  await expect(author).toContainText("E2E Second");

  await board.setOwner(text, "Nieprzypisany");
  await expect(author).toContainText("Nieprzypisany");

  await firstUser.page.reload();
  await expect(author).toContainText("Nieprzypisany");
});

test("dragged task stays in the new column after reload", async ({
  firstUser,
}) => {
  const { teamName } = await createTeam(firstUser.page);
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();
  const text = uuid();
  await board.addTask(0, text);
  await expect(board.column(0).getByText(text)).toBeVisible();

  await board.moveTask(text, 1);

  await firstUser.page.reload();
  await expect(board.column(1).getByText(text)).toBeVisible();
  await expect(board.column(0).getByText(text)).toHaveCount(0);
});

test("task changes appear in realtime for another user", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();
  const otherBoard = new BoardPage(secondUser.page);
  await otherBoard.waitForLoaded();

  const text = uuid();
  const edited = uuid();

  await board.addTask(0, text);
  await expect(otherBoard.column(0).getByText(text)).toBeVisible();

  await board.editTask(text, edited);
  await expect(otherBoard.card(edited)).toBeVisible();
  await expect(otherBoard.card(text)).toHaveCount(0);

  await board.moveTask(edited, 1);
  await expect(otherBoard.column(1).getByText(edited)).toBeVisible();

  await board.deleteTask(edited);
  await expect(otherBoard.cards).toHaveCount(0);
});

test("only-mine switch dims tasks of other users", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();
  const otherBoard = new BoardPage(secondUser.page);
  await otherBoard.waitForLoaded();

  const mine = uuid();
  const theirs = uuid();
  await board.addTask(0, mine);
  await otherBoard.addTask(0, theirs);
  await expect(board.card(theirs)).toBeVisible();

  const dimmed = (text: string) =>
    board.column(0).locator(".opacity-30").filter({ hasText: text });

  await expect(dimmed(theirs)).toHaveCount(0);
  await board.onlyMineSwitch.click();

  await expect(dimmed(theirs)).toHaveCount(1);
  await expect(dimmed(mine)).toHaveCount(0);
  // other tasks are dimmed, not hidden
  await expect(board.card(theirs)).toBeVisible();
  // own tasks are moved to the top
  await expect(board.column(0).getByTestId("card").first()).toContainText(mine);

  await board.onlyMineSwitch.click();
  await expect(dimmed(theirs)).toHaveCount(0);
});

test("only the owner sees the board edit button", async ({
  firstUser,
  secondUser,
}) => {
  const { teamName } = await createTeamWithMember(
    firstUser.page,
    secondUser.page,
  );
  await new HomePage(firstUser.page).gotoTaskList(teamName);
  const board = new BoardPage(firstUser.page);
  await board.waitForLoaded();
  const otherBoard = new BoardPage(secondUser.page);

  await expect(board.editBoardButton).toBeVisible();
  await otherBoard.waitForLoaded();
  await expect(otherBoard.editBoardButton).toHaveCount(0);

  await board.editBoardButton.click();
  await expect(firstUser.page).toHaveURL(/\/team\/.+\/board\/edit/);
});

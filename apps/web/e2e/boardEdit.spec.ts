import { randomUUID as uuid } from "node:crypto";
import type { Page } from "@playwright/test";
import { expect, test } from "../playwright/fixtures";
import { dragColumn } from "./helpers/dragColumn";
import { createTeam, createTeamWithMember } from "./helpers/retroSetup";
import { BoardEditPage } from "./pages/BoardEditPage";
import { BoardPage } from "./pages/BoardPage";
import { HomePage } from "./pages/HomePage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

const setup = async (page: Page) => {
  const { teamName } = await createTeam(page);
  await new HomePage(page).gotoTaskList(teamName);
  const board = new BoardPage(page);
  await board.waitForLoaded();
  const teamId = board.teamId();
  const edit = new BoardEditPage(page);
  await edit.goto(teamId);
  return { teamId, board, edit };
};

const names = (edit: BoardEditPage) =>
  edit
    .columnNames()
    .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));

test("can add a column and save the board", async ({ firstUser }) => {
  const { board, edit } = await setup(firstUser.page);
  const initial = await edit.columns.count();
  const name = uuid().slice(0, 30);

  await edit.addColumn(name);
  await edit.save();

  await expect(firstUser.page).toHaveURL(/\/team\/.+\/board$/);
  await expect(firstUser.page.getByText("Tablicę zapisano")).toBeVisible();
  await expect(board.columns).toHaveCount(initial + 1);
  await expect(board.columns.last()).toContainText(name);
});

test("can rename a column", async ({ firstUser }) => {
  const { board, edit } = await setup(firstUser.page);
  const name = uuid().slice(0, 30);

  await edit.renameColumn(0, name);
  await edit.save();

  await expect(firstUser.page.getByText("Tablicę zapisano")).toBeVisible();
  await expect(board.column(0)).toContainText(name);
});

test("can reorder columns", async ({ firstUser }) => {
  const { board, edit } = await setup(firstUser.page);
  const first = uuid().slice(0, 30);
  const second = uuid().slice(0, 30);
  await edit.renameColumn(0, first);
  await edit.renameColumn(1, second);

  await dragColumn({
    page: firstUser.page,
    source: edit.columns.nth(0),
    target: edit.columns.nth(1),
  });
  await expect
    .poll(async () => (await names(edit)).slice(0, 2))
    .toEqual([second, first]);

  await edit.save();
  await expect(firstUser.page.getByText("Tablicę zapisano")).toBeVisible();
  await expect(board.column(0)).toContainText(second);
  await expect(board.column(1)).toContainText(first);
});

test("new column button is disabled at six columns", async ({ firstUser }) => {
  const { edit } = await setup(firstUser.page);

  while ((await edit.columns.count()) < 6) {
    await edit.addColumn(uuid().slice(0, 20));
  }

  await expect(edit.columns).toHaveCount(6);
  await expect(edit.addColumnButton).toBeDisabled();

  await edit.removeColumn(5);
  await expect(edit.addColumnButton).toBeEnabled();
});

test("removing a column moves its tasks to the default column", async ({
  firstUser,
}) => {
  const { teamId, board, edit } = await setup(firstUser.page);
  const lastIndex = (await edit.columns.count()) - 1;
  expect(lastIndex).toBeGreaterThan(0);

  await board.goto(teamId);
  const text = uuid();
  await board.addTask(lastIndex, text);
  await expect(board.column(lastIndex).getByText(text)).toBeVisible();

  await edit.goto(teamId);
  await edit.removeColumn(lastIndex);
  await expect(edit.columns).toHaveCount(lastIndex);
  await edit.save();

  await expect(firstUser.page.getByText("Tablicę zapisano")).toBeVisible();
  await expect(board.columns).toHaveCount(lastIndex);
  await expect(board.column(0).getByText(text)).toBeVisible();
});

test("the default column cannot be removed", async ({ firstUser }) => {
  const { edit } = await setup(firstUser.page);
  const count = await edit.columns.count();

  await edit.removeColumn(0);

  await expect(edit.columns).toHaveCount(count);
});

test("a member cannot save the board", async ({ firstUser, secondUser }) => {
  await createTeamWithMember(firstUser.page, secondUser.page);
  const board = new BoardPage(secondUser.page);
  await board.waitForLoaded();
  const teamId = board.teamId();

  const edit = new BoardEditPage(secondUser.page);
  await edit.goto(teamId);
  await edit.renameColumn(0, uuid().slice(0, 30));
  await edit.save();

  await expect(secondUser.page.getByText("Wystąpił błąd")).toBeVisible();
  await expect(secondUser.page).toHaveURL(/\/board\/edit/);
});

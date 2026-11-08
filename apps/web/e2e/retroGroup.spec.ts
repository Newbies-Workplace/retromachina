import { expect, test } from "../playwright/fixtures";
import {
  createRetro,
  createTeamWithMember,
  joinRetro,
} from "./helpers/retroSetup";
import { GroupPage } from "./pages/GroupPage";
import { ReflectionPage } from "./pages/ReflectionPage";

test.use({ permissions: ["clipboard-write", "clipboard-read"] });

test.describe("group", () => {
  test.describe.configure({ timeout: 90_000 });
  let owner: GroupPage;
  let member: GroupPage;

  test.beforeEach(async ({ firstUser, secondUser }) => {
    const { teamName } = await createTeamWithMember(
      firstUser.page,
      secondUser.page,
    );
    const retroId = await createRetro(firstUser.page, teamName);
    await joinRetro(secondUser.page, retroId);

    const ownerReflection = new ReflectionPage(firstUser.page);
    const memberReflection = new ReflectionPage(secondUser.page);
    await ownerReflection.createCard("Owner card");
    await ownerReflection.createCard("Owner second");
    await memberReflection.createCard("Member card");
    await expect(ownerReflection.teamCounter(0)).toHaveText(/^3 kartki/);

    await ownerReflection.gotoStage("group");
    await expect(secondUser.page).toHaveURL(/\/group/);
    owner = new GroupPage(firstUser.page);
    member = new GroupPage(secondUser.page);
  });

  test("everyone sees all cards in the group phase", async () => {
    for (const view of [owner, member]) {
      await expect(view.cardsLocator).toHaveCount(3);
      await expect(view.card("Owner card")).toBeVisible();
      await expect(view.card("Owner second")).toBeVisible();
      await expect(view.card("Member card")).toBeVisible();
    }
  });

  test("merges cards into a group synced to other users", async () => {
    await owner.mergeCard("Member card", "Owner card");

    for (const view of [owner, member]) {
      await expect(
        view.groupContaining("Owner card", "Member card"),
      ).toHaveCount(1);
      await expect(view.groupContaining("Owner second")).toHaveCount(1);
    }
  });

  test("ungroups a child card by dropping it on an empty area", async () => {
    await owner.mergeCard("Member card", "Owner card");
    await expect(
      owner.groupContaining("Owner card", "Member card"),
    ).toHaveCount(1);

    await owner.dropInColumn("Member card", 0);
    for (const view of [owner, member]) {
      await expect(
        view.groupContaining("Owner card", "Member card"),
      ).toHaveCount(0);
      await expect(view.cardsLocator).toHaveCount(3);
    }
  });

  test("moves a whole group to another column", async () => {
    await owner.mergeCard("Member card", "Owner card");
    await expect(
      owner.groupContaining("Owner card", "Member card"),
    ).toHaveCount(1);

    await owner.dropInColumn("Owner card", 1);
    for (const view of [owner, member]) {
      await expect(view.cardsInColumn(1)).toHaveCount(2);
      await expect(view.cardsInColumn(0)).toHaveCount(1);
      await expect(
        view.cardsInColumn(1).filter({ hasText: "Owner card" }),
      ).toHaveCount(1);
      await expect(
        view.cardsInColumn(1).filter({ hasText: "Member card" }),
      ).toHaveCount(1);
    }
  });
});

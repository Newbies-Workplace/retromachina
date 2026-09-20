import * as fs from "node:fs";
import { v4 as uuid } from "uuid";
import {
  expect,
  firstAuthFile,
  secondAuthFile,
  test,
} from "../playwright/fixtures";
import { InvitationAcceptPage } from "./pages/InvitationAcceptPage";
import { PokerPage } from "./pages/PokerPage";

type StoredAuth = {
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

type TeamResponse = {
  id: string;
  name: string;
  invite_key?: string;
};

const appOrigin = "http://localhost:8080";
const apiUrl = (
  process.env.RETRO_WEB_API_URL ?? "http://localhost:3000/api/rest/v1"
).replace(/\/$/, "");

const getBearer = (authFile: string) => {
  const auth = JSON.parse(fs.readFileSync(authFile, "utf8")) as StoredAuth;
  const origin = auth.origins.find(({ origin }) => origin === appOrigin);
  const bearer = origin?.localStorage.find(({ name }) => name === "Bearer");

  if (!bearer) {
    throw new Error(`Bearer token not found in ${authFile}`);
  }

  return bearer.value;
};

const createTeam = async (token: string, name = uuid()) => {
  const inviteKey = uuid();
  const response = await fetch(`${apiUrl}/teams`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      invite_key: inviteKey,
    }),
  });

  await expectResponseOk(response, "create team");

  return response.json() as Promise<TeamResponse>;
};

const expectResponseOk = async (response: Response, action: string) => {
  if (response.ok) return;

  throw new Error(
    `Failed to ${action}: ${response.status} ${response.statusText} ${await response.text()}`,
  );
};

const getInviteKey = (team: TeamResponse) => {
  if (!team.invite_key) {
    throw new Error(`Team ${team.id} has no invite key`);
  }

  return team.invite_key;
};

const acceptTeamInvite = async (token: string, inviteKey: string) => {
  const response = await fetch(
    `${apiUrl}/teams/link_invite/${inviteKey}/accept`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  await expectResponseOk(response, "accept team invite");
};

test.describe
  .serial("Poker view", () => {
    let firstUserToken: string;
    let secondUserToken: string;
    let sharedTeam: TeamResponse;

    test.beforeAll(async () => {
      firstUserToken = getBearer(firstAuthFile);
      secondUserToken = getBearer(secondAuthFile);

      sharedTeam = await createTeam(firstUserToken);
      await acceptTeamInvite(secondUserToken, getInviteKey(sharedTeam));
    });

    test("updates instantly on both sides when a user joins team and enters poker view", async ({
      firstUser,
      secondUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);

      await firstUserPoker.goto(team.id);
      await expect(firstUserPoker.playersLocator).toHaveCount(1);

      await secondUser.page.goto(`/invitation/${getInviteKey(team)}`);
      await new InvitationAcceptPage(secondUser.page).acceptInvitation();
      await expect(secondUser.page).toHaveURL(/\/.*\/board/);

      await secondUserPoker.goto(team.id);

      await expect(firstUserPoker.playersLocator).toHaveCount(2);
      await expect(secondUserPoker.playersLocator).toHaveCount(2);
    });

    test("removes disconnected user from the table for remaining users", async ({
      firstUser,
      secondUser,
    }) => {
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);

      await firstUserPoker.goto(sharedTeam.id);
      await secondUserPoker.goto(sharedTeam.id);

      await expect(firstUserPoker.playersLocator).toHaveCount(2);
      await expect(secondUserPoker.playersLocator).toHaveCount(2);

      await secondUser.page.close();

      await expect(firstUserPoker.playersLocator).toHaveCount(1);
    });

    test("shows card counters after cards are revealed", async ({
      firstUser,
      secondUser,
    }) => {
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);

      await firstUserPoker.goto(sharedTeam.id);
      await secondUserPoker.goto(sharedTeam.id);

      await firstUserPoker.selectCard("8");
      await secondUserPoker.selectCard("8");
      await firstUserPoker.revealCards();

      await expect(firstUserPoker.cardVoteCounter("8")).toHaveText("2");
      await expect(secondUserPoker.cardVoteCounter("8")).toHaveText("2");
    });

    test("switches deck for everyone in the room", async ({
      firstUser,
      secondUser,
    }) => {
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);

      await firstUserPoker.goto(sharedTeam.id);
      await secondUserPoker.goto(sharedTeam.id);

      await firstUserPoker.switchDeck("Talia koszulkowa");

      await expect(firstUserPoker.card("XS")).toBeVisible();
      await expect(secondUserPoker.card("XS")).toBeVisible();
      await expect(firstUserPoker.card("32")).not.toBeVisible();
      await expect(secondUserPoker.card("32")).not.toBeVisible();

      await secondUserPoker.switchDeck("Talia zwykła");

      await expect(firstUserPoker.card("32")).toBeVisible();
      await expect(secondUserPoker.card("32")).toBeVisible();
      await expect(firstUserPoker.card("XS")).not.toBeVisible();
      await expect(secondUserPoker.card("XS")).not.toBeVisible();
    });

    test("keeps selected cards hidden until they are revealed on both sides", async ({
      firstUser,
      secondUser,
    }) => {
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);

      await firstUserPoker.goto(sharedTeam.id);
      await secondUserPoker.goto(sharedTeam.id);

      await firstUserPoker.selectCard("8");
      await secondUserPoker.selectCard("16");

      await expect(firstUserPoker.revealedCardsLocator).toHaveCount(0);
      await expect(secondUserPoker.revealedCardsLocator).toHaveCount(0);

      await secondUserPoker.revealCards();

      await firstUserPoker.expectRevealedCards(["8", "16"]);
      await secondUserPoker.expectRevealedCards(["8", "16"]);
    });

    test("shows and hides revealed cards without clearing selected cards", async ({
      firstUser,
      secondUser,
    }) => {
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);

      await firstUserPoker.goto(sharedTeam.id);
      await secondUserPoker.goto(sharedTeam.id);

      await firstUserPoker.selectCard("4");
      await secondUserPoker.selectCard("8");
      await firstUserPoker.revealCards();

      await expect(firstUserPoker.revealedCardsLocator).toHaveCount(2);
      await expect(secondUserPoker.revealedCardsLocator).toHaveCount(2);

      await secondUserPoker.clearTable();

      await expect(firstUserPoker.revealedCardsLocator).toHaveCount(0);
      await expect(secondUserPoker.revealedCardsLocator).toHaveCount(0);
      await expect(firstUserPoker.card("4")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(secondUserPoker.card("8")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

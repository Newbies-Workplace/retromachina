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
  cookies?: Array<{ name: string; value: string }>;
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
  const bearer =
    auth.cookies?.find(({ name }) => name === "retro_session") ??
    origin?.localStorage.find(({ name }) => name === "Bearer");

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

    test("plays readiness sound once per player until the table is cleared", async ({
      firstUser,
      secondUser,
    }) => {
      await firstUser.page.addInitScript(() => {
        let plays = 0;
        HTMLMediaElement.prototype.play = async function () {
          if (this.src.includes("ready-single")) {
            document.documentElement.dataset.readySoundPlays = String(++plays);
          }
        };
      });
      const poker = new PokerPage(firstUser.page);
      const otherPoker = new PokerPage(secondUser.page);
      await poker.goto(sharedTeam.id);
      await otherPoker.goto(sharedTeam.id);
      await poker.clearTable();

      const soundCount = firstUser.page.locator("html");
      await otherPoker.selectCard("1");
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "1");
      await otherPoker.selectCard("2");
      await otherPoker.revealCards();
      await poker.expectRevealedCards(["2"]);
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "1");

      await otherPoker.clearTable();
      await otherPoker.selectCard("4");
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "2");

      await poker.selectCard("8");
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "5");
      await poker.selectCard("16");
      await poker.revealCards();
      await poker.expectRevealedCards(["4", "16"]);
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "5");

      await otherPoker.clearTable();
      await otherPoker.selectCard("1");
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "6");
      await poker.selectCard("2");
      await expect(soundCount).toHaveAttribute("data-ready-sound-plays", "9");
    });

    test("opens and dismisses the gramophone from the navbar", async ({
      firstUser,
    }) => {
      await new PokerPage(firstUser.page).goto(sharedTeam.id);

      await firstUser.page
        .getByRole("button", { name: "Otwórz gramofon" })
        .click();
      await expect(
        firstUser.page.getByText("Gramofon", { exact: true }),
      ).toBeVisible();

      await firstUser.page
        .getByRole("button", { name: "Odkryj karty" })
        .click();
      await expect(
        firstUser.page.getByText("Gramofon", { exact: true }),
      ).not.toBeVisible();
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

    test("keeps the revealed card visible until cards are revealed again", async ({
      firstUser,
    }) => {
      const firstUserPoker = new PokerPage(firstUser.page);

      await firstUserPoker.goto(sharedTeam.id);
      await firstUserPoker.clearTable();
      await firstUserPoker.selectCard("1");
      await firstUserPoker.revealCards();

      await firstUserPoker.expectRevealedCards(["1"]);

      await firstUserPoker.selectCard("2");
      await firstUserPoker.expectRevealedCards(["1"]);

      await firstUserPoker.revealCards();
      await firstUserPoker.expectRevealedCards(["2"]);
    });

    test("clears revealed and selected cards for everyone", async ({
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
        "false",
      );
      await expect(secondUserPoker.card("8")).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });

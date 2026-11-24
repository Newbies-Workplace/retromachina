import { randomUUID as uuid } from "node:crypto";
import * as fs from "node:fs";
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

    test("lets a team member add, edit and delete a custom deck", async ({
      firstUser,
      secondUser,
    }) => {
      const team = await createTeam(firstUserToken);
      await acceptTeamInvite(secondUserToken, getInviteKey(team));
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);
      const deckName = "Fibonacci";

      await firstUserPoker.goto(team.id);
      await secondUserPoker.goto(team.id);

      // The second user joined via invite, so this runs as a regular member.
      await secondUserPoker.createDeck(deckName, "1, 2, 3, 5, 8, 13");

      await expect(firstUserPoker.card("13")).toBeVisible();
      await expect(firstUserPoker.card("32")).not.toBeVisible();
      await expect(firstUser.page.getByTestId("deck-picker")).toContainText(
        deckName,
      );

      await firstUserPoker.selectCard("8");
      await secondUserPoker.selectCard("13");
      await secondUserPoker.editDeck(deckName, "1, 2, 3, 5, 8, 21");

      await expect(firstUserPoker.card("21")).toBeVisible();
      await expect(secondUserPoker.card("13")).not.toBeVisible();
      await expect(firstUserPoker.card("8")).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      await firstUserPoker.deleteDeck(deckName);

      await expect(firstUserPoker.card("32")).toBeVisible();
      await expect(secondUserPoker.card("32")).toBeVisible();
      await expect(secondUser.page.getByTestId("deck-picker")).toContainText(
        "Talia zwykła",
      );
    });

    const invalidDecks = [
      {
        title: "an empty name",
        name: "",
        cards: "1, 2, 3",
        error: "Nazwa talii jest wymagana",
      },
      {
        title: "a whitespace-only name",
        name: "   ",
        cards: "1, 2, 3",
        error: "Nazwa talii jest wymagana",
      },
      {
        title: "a single card",
        name: "Jedna karta",
        cards: "5",
        error: "co najmniej 2 karty",
      },
      {
        title: "no cards",
        name: "Pusta talia",
        cards: " , ,",
        error: "co najmniej 2 karty",
      },
      {
        title: "more than 15 cards",
        name: "Za dużo kart",
        cards: Array.from({ length: 16 }, (_, index) => index + 1).join(", "),
        error: "maksymalnie 15 kart",
      },
      {
        title: "a card label that is too long",
        name: "Długa karta",
        cards: "1, 12345",
        error: "jest za długa",
      },
      {
        title: "a duplicated card",
        name: "Zła talia",
        cards: "1, 1, 2",
        error: "więcej niż raz",
      },
    ];

    for (const { title, name, cards, error } of invalidDecks) {
      test(`rejects a custom deck with ${title}`, async ({ firstUser }) => {
        const team = await createTeam(firstUserToken);
        const poker = new PokerPage(firstUser.page);
        await poker.goto(team.id);

        await poker.fillNewDeck(name, cards);
        await poker.saveDeck();

        await expect(firstUser.page.getByRole("alert")).toContainText(error);
        await expect(firstUser.page.getByTestId("deck-save")).toBeVisible();
        await expect(poker.deckPicker).toContainText("Talia zwykła");

        // Nothing was saved: after a reload the team still has only the defaults.
        await firstUser.page.reload();
        await poker.openDeckPicker();
        await expect(
          firstUser.page.getByRole("button", { name: /^Edytuj talię/ }),
        ).toHaveCount(0);
      });
    }

    test("accepts a custom deck with exactly two cards", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const poker = new PokerPage(firstUser.page);
      await poker.goto(team.id);

      await poker.createDeck("Tak / Nie", "Tak, Nie");

      await expect(poker.card("Tak")).toBeVisible();
      await expect(poker.card("Nie")).toBeVisible();
      await expect(poker.card("32")).not.toBeVisible();
    });

    test("trims card labels and ignores empty entries", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const poker = new PokerPage(firstUser.page);
      await poker.goto(team.id);

      await poker.createDeck("  Spacje  ", " 1 ,, 2 ;  3 , ");

      await expect(poker.deckPicker).toHaveText("Spacje");
      for (const card of ["1", "2", "3"]) {
        await expect(poker.card(card)).toBeVisible();
      }
    });

    test("discards a new deck when the editor is cancelled", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const page = firstUser.page;
      const poker = new PokerPage(page);
      await poker.goto(team.id);

      await poker.fillNewDeck("Porzucona", "1, 2, 3");
      await page.getByRole("button", { name: "Anuluj" }).click();

      await expect(poker.deckOption("Porzucona")).toHaveCount(0);
      await expect(page.getByTestId("deck-create")).toBeVisible();
    });

    test("keeps a custom deck after the page is reloaded", async ({
      firstUser,
      secondUser,
    }) => {
      const team = await createTeam(firstUserToken);
      await acceptTeamInvite(secondUserToken, getInviteKey(team));
      const firstUserPoker = new PokerPage(firstUser.page);
      const secondUserPoker = new PokerPage(secondUser.page);
      const deckName = "Trwała talia";

      await firstUserPoker.goto(team.id);
      await secondUserPoker.goto(team.id);
      await firstUserPoker.createDeck(deckName, "1, 3, 9, 27");

      // The room stays open thanks to the second user, so it keeps the deck.
      await firstUser.page.reload();
      await expect(firstUserPoker.deckPicker).toContainText(deckName);
      await expect(firstUserPoker.card("27")).toBeVisible();

      // Once everybody leaves the room closes, but the team's last deck is
      // remembered and used when the table opens again.
      await firstUser.page.goto("/");
      await expect(secondUserPoker.playersLocator).toHaveCount(1);
      await secondUser.page.goto("/");
      await secondUserPoker.goto(team.id);
      await expect(secondUserPoker.deckPicker).toContainText(deckName);
      await expect(secondUserPoker.card("27")).toBeVisible();

      // Edits are stored as well, not only pushed to the open room.
      await secondUserPoker.editDeck(deckName, "1, 3, 9, 81");
      await secondUser.page.reload();
      await expect(secondUserPoker.card("81")).toBeVisible();
      await expect(secondUserPoker.card("27")).not.toBeVisible();
    });

    test("opens the table with the deck the team used last", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const page = firstUser.page;
      const poker = new PokerPage(page);
      await poker.goto(team.id);

      await poker.switchDeck("Talia koszulkowa");
      await page.goto("/");
      await poker.goto(team.id);

      await expect(poker.deckPicker).toContainText("Talia koszulkowa");
      await expect(poker.card("XL")).toBeVisible();

      // A reload while sitting alone at the table keeps the deck as well.
      await page.reload();
      await expect(poker.deckPicker).toContainText("Talia koszulkowa");
      await expect(poker.card("XL")).toBeVisible();

      // Another team keeps its own choice.
      const otherTeam = await createTeam(firstUserToken);
      await poker.goto(otherTeam.id);
      await expect(poker.deckPicker).toContainText("Talia zwykła");
    });

    test("falls back to the default deck when the last deck was deleted", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const page = firstUser.page;
      const poker = new PokerPage(page);
      const deckName = "Chwilowa";
      await poker.goto(team.id);

      await poker.createDeck(deckName, "A, B");
      await poker.deleteDeck(deckName);
      await page.goto("/");
      await poker.goto(team.id);

      await expect(poker.deckPicker).toContainText("Talia zwykła");
      await expect(poker.card("32")).toBeVisible();
    });

    test("removes a deleted deck for good", async ({ firstUser }) => {
      const team = await createTeam(firstUserToken);
      const poker = new PokerPage(firstUser.page);
      const deckName = "Do usunięcia";
      await poker.goto(team.id);

      await poker.createDeck(deckName, "1, 2");
      await poker.deleteDeck(deckName);
      await firstUser.page.reload();

      await poker.openDeckPicker();
      await expect(poker.deckOption(deckName)).toHaveCount(0);
    });

    test("keeps a deck when its deletion is cancelled", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const page = firstUser.page;
      const poker = new PokerPage(page);
      const deckName = "Zostaje";
      await poker.goto(team.id);

      await poker.createDeck(deckName, "1, 2");
      await poker.requestDeckDeletion(deckName);
      await expect(poker.deckDeleteConfirmation).toContainText(deckName);

      await page.getByTestId("deck-delete-cancel").click();
      await expect(poker.deckDeleteConfirmation).not.toBeVisible();
      // The picker stays open with the deck still in it.
      await expect(poker.deckOption(deckName)).toBeVisible();

      await page.keyboard.press("Escape");
      await page.reload();
      await poker.openDeckPicker();
      await expect(poker.deckOption(deckName)).toBeVisible();
    });

    test("keeps the active deck when another deck is deleted", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const poker = new PokerPage(firstUser.page);
      await poker.goto(team.id);

      await poker.createDeck("Zapasowa", "A, B");
      await poker.createDeck("Aktywna", "X, Y");
      await poker.selectCard("X");
      await poker.deleteDeck("Zapasowa");

      await expect(poker.deckPicker).toContainText("Aktywna");
      await expect(poker.card("X")).toHaveAttribute("aria-pressed", "true");
    });

    test("does not show a team's custom decks to other teams", async ({
      firstUser,
    }) => {
      const team = await createTeam(firstUserToken);
      const otherTeam = await createTeam(firstUserToken);
      const poker = new PokerPage(firstUser.page);
      const deckName = "Tylko dla jednego zespołu";

      await poker.goto(team.id);
      await poker.createDeck(deckName, "1, 2");
      await poker.goto(otherTeam.id);

      await expect(poker.deckPicker).toContainText("Talia zwykła");
      await poker.openDeckPicker();
      await expect(poker.deckOption(deckName)).toHaveCount(0);
    });

    test("guards the poker deck API", async () => {
      const team = await createTeam(firstUserToken);
      const otherTeam = await createTeam(firstUserToken);
      const decksUrl = (teamId: string) =>
        `${apiUrl}/teams/${teamId}/poker_decks`;
      const request = (
        token: string,
        url: string,
        method: string,
        body?: unknown,
      ) =>
        fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });

      // Validation is enforced by the API, not only by the editor.
      for (const body of [
        { name: "", cards: ["1", "2"] },
        { name: "Jedna", cards: ["1"] },
        { name: "Duplikat", cards: ["1", "1"] },
        { name: "x".repeat(51), cards: ["1", "2"] },
        { name: "Zły typ", cards: "1, 2" },
      ]) {
        const response = await request(
          firstUserToken,
          decksUrl(team.id),
          "POST",
          body,
        );
        expect(response.status, JSON.stringify(body)).toBe(400);
      }

      const created = await request(firstUserToken, decksUrl(team.id), "POST", {
        name: "API",
        cards: ["1", "2"],
      });
      await expectResponseOk(created, "create poker deck");
      const deck = (await created.json()) as { id: string };

      // The second user is not a member of this team.
      expect(
        (await request(secondUserToken, decksUrl(team.id), "GET")).status,
      ).toBe(403);
      expect(
        (
          await request(secondUserToken, decksUrl(team.id), "POST", {
            name: "Obca",
            cards: ["1", "2"],
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(
            secondUserToken,
            `${decksUrl(team.id)}/${deck.id}`,
            "DELETE",
          )
        ).status,
      ).toBe(403);

      // A deck cannot be reached through another team's URL.
      expect(
        (
          await request(
            firstUserToken,
            `${decksUrl(otherTeam.id)}/${deck.id}`,
            "PUT",
            { name: "Przejęta", cards: ["1", "2"] },
          )
        ).status,
      ).toBe(404);
      expect(
        (
          await request(
            firstUserToken,
            `${decksUrl(otherTeam.id)}/${deck.id}`,
            "DELETE",
          )
        ).status,
      ).toBe(404);

      const decks = (await (
        await request(firstUserToken, decksUrl(team.id), "GET")
      ).json()) as Array<{ id: string; name: string }>;
      expect(decks.find(({ id }) => id === deck.id)?.name).toBe("API");
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

import { randomUUID as uuid } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { InvitationAcceptPage } from "../pages/InvitationAcceptPage";
import { RetroCreatePage } from "../pages/RetroCreatePage";
import { TeamCreatePage } from "../pages/team_form/TeamCreatePage";

export const DEFAULT_COLUMNS = [
  { name: "First", description: "First description" },
  { name: "Second", description: "Second description" },
];

/**
 * Creates a UUID-named team owned by the user of `page` and returns its name.
 * Pass `withInvitationLink` to also generate an invitation link (requires
 * clipboard permissions, see `test.use({ permissions })`).
 */
export async function createTeam(
  page: Page,
  { withInvitationLink = false }: { withInvitationLink?: boolean } = {},
): Promise<{ teamName: string; invitationLink?: string }> {
  const teamName = uuid();
  const teamCreatePage = new TeamCreatePage(page);
  await teamCreatePage.goto();
  await teamCreatePage.fillTeamName(teamName);

  let invitationLink: string | undefined;
  if (withInvitationLink) {
    await teamCreatePage.generateInvitationLink();
    invitationLink = await teamCreatePage.copyInvitationLink();
  }

  await teamCreatePage.saveTeam();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId(`team-${teamName}`)).toBeVisible();

  return { teamName, invitationLink };
}

/** Accepts an invitation link as the user of `page` (joins with the USER role). */
export async function acceptInvitation(page: Page, invitationLink: string) {
  await page.goto(invitationLink);
  await new InvitationAcceptPage(page).acceptInvitation();
  await expect(page).toHaveURL(/\/.*\/board/);
}

/**
 * Creates a team owned by `owner` with `member` joined through an invitation
 * link. Tests using it need `permissions: ["clipboard-write", "clipboard-read"]`.
 */
export async function createTeamWithMember(
  owner: Page,
  member: Page,
): Promise<{ teamName: string }> {
  const { teamName, invitationLink } = await createTeam(owner, {
    withInvitationLink: true,
  });
  if (!invitationLink) throw new Error("Invitation link was not generated");
  await acceptInvitation(member, invitationLink);
  return { teamName };
}

/**
 * Starts a retro (without warmup) for `teamName` with the given columns and
 * returns its id. The page ends on `/retro/:id/reflection`.
 */
export async function createRetro(
  page: Page,
  teamName: string,
  columns: Array<{ name: string; description?: string }> = DEFAULT_COLUMNS,
): Promise<string> {
  const homePage = new HomePage(page);
  await homePage.goto();
  const createRetroButton = page
    .getByTestId(`team-${teamName}`)
    .getByTestId("create-retro");
  await expect(createRetroButton).toBeVisible();
  // Home re-renders while team data loads: a click can be lost, and the
  // create view can bounce back to Home before the user's teams are loaded.
  await expect(async () => {
    if (!/\/retro\/create/.test(page.url())) {
      await createRetroButton.click({ timeout: 5_000 });
    }
    await expect(page.getByTestId("clear-template")).toBeVisible({
      timeout: 5_000,
    });
  }).toPass({ timeout: 30_000 });
  const createRetroPage = new RetroCreatePage(page);
  await createRetroPage.replaceColumns(columns);
  await createRetroPage.createRetro();
  await expect(page).toHaveURL(/\/retro\/.+\/reflection/);

  const retroId = page.url().match(/\/retro\/([^/]+)\//)?.[1];
  if (!retroId) throw new Error(`Cannot read retro id from ${page.url()}`);
  return retroId;
}

/** Opens a running retro as another participant. */
export async function joinRetro(page: Page, retroId: string) {
  await page.goto(`/retro/${retroId}/reflection`);
  await expect(page.getByTestId("retro-toolbar")).toBeVisible();
}

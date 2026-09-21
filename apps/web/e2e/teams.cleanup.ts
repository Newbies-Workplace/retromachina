import { expect, test } from "../playwright/fixtures";

const testTeamNamePattern =
  /^(?:Notifications )?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test("removes all teams named as UUIDs", async ({ firstUser }) => {
  const { page } = firstUser;
  const storageState = await page.context().storageState();
  const accessToken = storageState.origins
    .find((origin) => origin.origin === "http://localhost:8080")
    ?.localStorage.find(({ name }) => name === "Bearer")?.value;

  if (!accessToken) {
    throw new Error("First E2E user has no API access token");
  }

  const apiUrl =
    process.env.RETRO_WEB_API_URL ?? "http://localhost:3000/api/rest/v1/";
  const headers = { Authorization: `Bearer ${accessToken}` };
  const currentUserResponse = await page.request.get(
    new URL("users/@me", apiUrl).toString(),
    { headers },
  );
  expect(currentUserResponse.ok()).toBeTruthy();

  const currentUser = (await currentUserResponse.json()) as {
    teams: Array<{ id: string; name: string }>;
  };
  const testTeams = currentUser.teams.filter((team) =>
    testTeamNamePattern.test(team.name),
  );

  for (const team of testTeams) {
    const deleteTeamResponse = await page.request.delete(
      new URL(`teams/${team.id}`, apiUrl).toString(),
      { headers },
    );
    expect(deleteTeamResponse.ok()).toBeTruthy();
  }

  console.log(`Removed ${testTeams.length} test team(s) and their retros.`);
});

import * as fs from "node:fs";
import jwt from "jsonwebtoken";
import {
  firstAuthFile,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

type StoredAuth = {
  cookies: Array<{ name: string; value: string }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

function refreshToken(file: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required to prepare Playwright auth state");
  }

  if (!fs.existsSync(file)) {
    throw new Error(`Authentication file is missing: ${file}`);
  }

  const auth = JSON.parse(fs.readFileSync(file, "utf8")) as StoredAuth;
  const localhost = auth.origins.find(
    ({ origin }) => origin === "http://localhost:8080",
  );
  const bearer =
    auth.cookies.find(({ name }) => name === "retro_session") ??
    localhost?.localStorage.find(({ name }) => name === "Bearer");
  const payload = bearer ? jwt.decode(bearer.value) : null;

  if (
    !bearer ||
    typeof payload !== "object" ||
    payload === null ||
    !("user" in payload)
  ) {
    throw new Error(
      `Authentication file has no valid Bearer identity: ${file}`,
    );
  }

  const token = jwt.sign({ user: payload.user }, secret, { expiresIn: "30d" });
  const cookie = {
    name: "retro_session",
    value: token,
    domain: "localhost",
    path: "/api/rest/v1",
    expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  };
  auth.cookies = [cookie];
  for (const origin of auth.origins)
    origin.localStorage = origin.localStorage.filter(
      ({ name }) => name !== "Bearer",
    );
  fs.writeFileSync(file, JSON.stringify(auth));
}

setup("prepare test users authentication", async () => {
  refreshToken(firstAuthFile);
  refreshToken(secondAuthFile);
});

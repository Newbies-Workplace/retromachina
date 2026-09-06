import * as fs from "node:fs";
import jwt from "jsonwebtoken";
import {
  firstAuthFile,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

type StoredAuth = {
  cookies: unknown[];
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
  const bearer = localhost?.localStorage.find(({ name }) => name === "Bearer");
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

  bearer.value = jwt.sign({ user: payload.user }, secret);

  // Google session cookies are not needed after the application JWT exists.
  auth.cookies = [];
  fs.writeFileSync(file, JSON.stringify(auth));
}

setup("prepare test users authentication", async () => {
  refreshToken(firstAuthFile);
  refreshToken(secondAuthFile);
});

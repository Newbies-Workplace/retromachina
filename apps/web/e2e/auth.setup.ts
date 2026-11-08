import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import jwt from "jsonwebtoken";
import mariadb from "mariadb";
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

// Must match apps/api/src/auth/session/access-token.service.ts.
const JWT_ISSUER = "retromachina";
const JWT_AUDIENCE = "retromachina-api";
// Long enough for a full CI run (including retries) without a refresh cookie.
const TEST_SESSION_TTL_SECONDS = 4 * 60 * 60;

type DbUser = { id: string; nick: string; email: string; google_id: string };

async function prepareAuth(file: string, connection: mariadb.Connection) {
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
  const userId =
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.user?.id === "string"
      ? (payload.user.id as string)
      : null;

  if (!localhost || !bearer || !userId) {
    throw new Error(
      `Authentication file has no valid Bearer identity: ${file}`,
    );
  }

  const [user] = (await connection.query(
    "SELECT id, nick, email, google_id FROM `User` WHERE id = ?",
    [userId],
  )) as DbUser[];
  if (!user) {
    throw new Error(`Test user ${userId} from ${file} is not in the database`);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TEST_SESSION_TTL_SECONDS;
  const sessionId = randomUUID();
  await connection.query(
    "INSERT INTO `AuthSession` (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sessionId, user.id, new Date(expiresAt * 1000)],
  );

  bearer.value = jwt.sign(
    {
      sid: sessionId,
      exp: expiresAt,
      user: {
        id: user.id,
        nick: user.nick,
        email: user.email,
        google_id: user.google_id,
      },
    },
    secret,
    { algorithm: "HS256", issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
  );
  localhost.localStorage = [
    ...localhost.localStorage.filter(({ name }) => name !== "BearerExpiresAt"),
    { name: "BearerExpiresAt", value: String(expiresAt * 1000) },
  ];

  // Google session cookies are not needed after the application session exists.
  auth.cookies = [];
  fs.writeFileSync(file, JSON.stringify(auth));
}

setup("prepare test users authentication", async () => {
  const connection = await mariadb.createConnection({
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST || "127.0.0.1",
    password: process.env.DATABASE_PASSWORD || "retro",
    port: Number.parseInt(process.env.DATABASE_PORT ?? "", 10) || 3307,
    user: process.env.DATABASE_USER || "root",
  });
  try {
    await prepareAuth(firstAuthFile, connection);
    await prepareAuth(secondAuthFile, connection);
  } finally {
    await connection.end();
  }
});

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import jwt from "jsonwebtoken";
import mariadb from "mariadb";
import {
  firstAuthFile,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

/**
 * Prepares both Playwright users without Google sign-in: the users are
 * created (or reused) directly in the test database, each gets a fresh
 * AuthSession, and a matching access token is written into the storage state
 * the fixtures load. Only a local database is accepted, so this can never
 * insert test accounts into a shared environment.
 */

// Must match apps/api/src/auth/session/access-token.service.ts.
const JWT_ISSUER = "retromachina";
const JWT_AUDIENCE = "retromachina-api";
// Long enough for a full run (including retries) without a refresh cookie.
const TEST_SESSION_TTL_SECONDS = 4 * 60 * 60;
const APP_ORIGIN = "http://localhost:8080";
const LOCAL_DB_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

type TestUser = { googleId: string; nick: string; email: string };

const TEST_USERS: Record<string, TestUser> = {
  [firstAuthFile]: {
    googleId: "e2e-first-user",
    nick: "E2E First",
    email: "e2e-first@retromachina.test",
  },
  [secondAuthFile]: {
    googleId: "e2e-second-user",
    nick: "E2E Second",
    email: "e2e-second@retromachina.test",
  },
};

async function prepareUser(
  connection: mariadb.Connection,
  file: string,
  testUser: TestUser,
  secret: string,
) {
  await connection.query(
    "INSERT INTO `User` (id, nick, email, avatar_link, google_id) VALUES (?, ?, ?, '', ?) " +
      "ON DUPLICATE KEY UPDATE nick = VALUES(nick)",
    [randomUUID(), testUser.nick, testUser.email, testUser.googleId],
  );
  const [user] = (await connection.query(
    "SELECT id, nick, email, google_id FROM `User` WHERE google_id = ?",
    [testUser.googleId],
  )) as { id: string; nick: string; email: string; google_id: string }[];

  const expiresAt = Math.floor(Date.now() / 1000) + TEST_SESSION_TTL_SECONDS;
  const sessionId = randomUUID();
  await connection.query(
    "INSERT INTO `AuthSession` (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sessionId, user.id, new Date(expiresAt * 1000)],
  );

  const token = jwt.sign(
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

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: APP_ORIGIN,
          localStorage: [
            { name: "Bearer", value: token },
            { name: "BearerExpiresAt", value: String(expiresAt * 1000) },
          ],
        },
      ],
    }),
  );
}

setup("prepare test users authentication", async () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required to prepare Playwright auth state");
  }

  const host = process.env.DATABASE_HOST || "127.0.0.1";
  if (!LOCAL_DB_HOSTS.has(host)) {
    throw new Error(
      `Refusing to create E2E users on non-local database host "${host}"`,
    );
  }

  const connection = await mariadb.createConnection({
    database: process.env.DATABASE_NAME,
    host,
    password: process.env.DATABASE_PASSWORD || "retro",
    port: Number.parseInt(process.env.DATABASE_PORT ?? "", 10) || 3307,
    user: process.env.DATABASE_USER || "root",
  });
  try {
    for (const [file, testUser] of Object.entries(TEST_USERS)) {
      await prepareUser(connection, file, testUser, secret);
    }
  } finally {
    await connection.end();
  }
});

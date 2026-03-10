import * as fs from "node:fs";
import * as process from "node:process";
import * as OTPAuth from "otpauth";
import {
  firstAuthFile,
  Page,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

/**
 * Download Chrome for testing
 *
 * npx @puppeteer/browsers install chrome@stable
 *
 * Start Chrome with remote debugging enabled
 *
 * --remote-debugging-port=9222
 *
 * clear browser data before running each setup test
 */
setup("authenticate as first user", async ({ setupBrowserPage }) => {
  if (fs.existsSync(firstAuthFile)) {
    return;
  }

  await authenticateWithCredentials(
    setupBrowserPage,
    process.env.E2E_FIRST_LOGIN,
    process.env.E2E_FIRST_PASSWORD,
    process.env.E2E_FIRST_OTP_SECRET,
  );

  await setupBrowserPage.context().storageState({ path: firstAuthFile });
});

setup("authenticate as second user", async ({ setupBrowserPage }) => {
  if (fs.existsSync(secondAuthFile)) {
    return;
  }

  await authenticateWithCredentials(
    setupBrowserPage,
    process.env.E2E_SECOND_LOGIN,
    process.env.E2E_SECOND_PASSWORD,
    process.env.E2E_SECOND_OTP_SECRET,
  );

  await setupBrowserPage.context().storageState({ path: secondAuthFile });
});

const authenticateWithCredentials = async (
  page: Page,
  login: string,
  password: string,
  otpSecret: string,
) => {
  await page.goto("http://localhost:8080/signin");
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', login);
  await page.click("#identifierNext");
  await page.waitForSelector('input[type="password"]', {
    state: "visible",
  });
  await page.fill('input[type="password"]', password);
  await page.waitForSelector("#passwordNext", {
    state: "visible",
  });
  await page.click("#passwordNext");

  const otpCode = generateOTP(otpSecret);
  console.log(`Generated OTP code: ${otpCode}`);

  await page.getByText("Google Authenticator", { exact: false }).click(); //waitFor({ state: "visible" });

  await page.getByLabel("Enter code").fill(otpCode);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.waitForURL("http://localhost:8080/");
};

function generateOTP(secret: string) {
  const totp = new OTPAuth.TOTP({
    secret: secret,
    digits: 6,
    algorithm: "sha1",
    period: 30,
  });

  return totp.generate();
}

import * as fs from "node:fs";
import * as process from "node:process";
import * as OTPAuth from "otpauth";
import {
  firstAuthFile,
  Page,
  secondAuthFile,
  test as setup,
} from "../playwright/fixtures";

setup("authenticate as first user", async ({ page }) => {
  if (fs.existsSync(firstAuthFile)) {
    return;
  }

  await authenticateWithCredentials(
    page,
    process.env.E2E_FIRST_LOGIN,
    process.env.E2E_FIRST_PASSWORD,
    process.env.E2E_FIRST_OTP_SECRET,
  );

  await page.context().storageState({ path: firstAuthFile });
});

setup("authenticate as second user", async ({ page }) => {
  if (fs.existsSync(secondAuthFile)) {
    return;
  }

  await authenticateWithCredentials(
    page,
    process.env.E2E_SECOND_LOGIN,
    process.env.E2E_SECOND_PASSWORD,
    process.env.E2E_SECOND_OTP_SECRET,
  );

  await page.context().storageState({ path: secondAuthFile });
});

const authenticateWithCredentials = async (
  page: Page,
  login: string,
  password: string,
  otpSecret: string,
) => {
  await page.goto("/signin");
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

  await page.getByLabel("Enter code").waitFor({ state: "visible" });

  const otpCode = generateOTP(otpSecret);
  await page.getByLabel("Enter code").fill(otpCode);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Allow" }).click();

  await page.waitForURL("/");
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

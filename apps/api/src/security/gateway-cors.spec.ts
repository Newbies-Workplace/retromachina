import { gatewayCors } from "./gateway-cors";

describe("gatewayCors", () => {
  const original = process.env.CALLBACK_URL;
  afterEach(() => {
    process.env.CALLBACK_URL = original;
  });

  const check = (origin: string | undefined) =>
    new Promise<boolean | undefined>((resolve) =>
      gatewayCors.origin(origin, (_error, allow) => resolve(allow)),
    );

  it("allows the frontend origin and origin-less clients only", async () => {
    process.env.CALLBACK_URL = "https://retro.example.com/auth/callback";

    await expect(check("https://retro.example.com")).resolves.toBe(true);
    await expect(check(undefined)).resolves.toBe(true);
    await expect(check("https://evil.example.com")).resolves.toBe(false);
    await expect(check("http://retro.example.com")).resolves.toBe(false);
  });

  it("rejects browser origins when CALLBACK_URL is missing", async () => {
    delete process.env.CALLBACK_URL;

    await expect(check("https://retro.example.com")).resolves.toBe(false);
  });
});

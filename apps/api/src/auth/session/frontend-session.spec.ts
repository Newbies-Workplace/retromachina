import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import * as ts from "typescript";

// Execute the real browser session module without adding a browser test dependency.
const browserSession = () => {
  const storage = new Map<string, string>();
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const axios = {
    post: jest.fn(),
    isAxiosError: (error: { response?: unknown }) => !!error.response,
  };
  const instance = {
    defaults: { headers: { common: {} as Record<string, string> } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  const module = { exports: {} };
  const source = readFileSync(
    resolve(__dirname, "../../../../web/src/api/auth-session.ts"),
    "utf8",
  );
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: () => axios,
      process: { env: { RETRO_WEB_API_URL: "http://api.test/api/rest/v1/" } },
      Date,
      Promise,
      Event: class {
        constructor(public type: string) {}
      },
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      navigator: {},
      window: {
        setTimeout,
        clearTimeout,
        addEventListener: (
          name: string,
          listener: (event: unknown) => void,
        ) => {
          const set = listeners.get(name) ?? new Set();
          set.add(listener);
          listeners.set(name, set);
        },
        removeEventListener: (
          name: string,
          listener: (event: unknown) => void,
        ) => listeners.get(name)?.delete(listener),
        dispatchEvent: (event: { type: string }) =>
          listeners.get(event.type)?.forEach((fn) => {
            fn(event);
          }),
      },
    },
  );
  const session = module.exports as {
    installAuthInterceptors(instance: unknown): void;
    setSession(value: { access_token: string; expires_at: number }): void;
    refreshSession(): Promise<string | null>;
    initializeSession(): Promise<string | null>;
    logoutSession(): Promise<void>;
    clearSession(): void;
  };
  session.installAuthInterceptors(instance);
  return { session, axios, instance, storage };
};

describe("browser session lifecycle", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] }));
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  const token = (value: string) => ({
    access_token: value,
    expires_at: Date.now() + 900_000,
  });

  it("renews an expired startup session and shares concurrent refreshes", async () => {
    const { session, axios, storage } = browserSession();
    axios.post.mockResolvedValue({ data: token("renewed") });
    const results = await Promise.all([
      session.initializeSession(),
      session.refreshSession(),
    ]);
    expect(results).toEqual(["renewed", "renewed"]);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(storage.get("Bearer")).toBe("renewed");
    expect(axios.post.mock.calls[0][2]).toMatchObject({
      withCredentials: true,
      headers: { "X-Requested-With": "Retromachina" },
    });
  });
  it("refreshes once before expiry and schedules the next renewal", async () => {
    const { session, axios } = browserSession();
    session.setSession(token("initial"));
    axios.post.mockImplementation(async () => ({ data: token("renewed") }));
    jest.advanceTimersByTime(840_000);
    await session.refreshSession();
    expect(axios.post).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
  it("does not loop renewals when absolute session expiry is less than a minute away", async () => {
    const { session, axios } = browserSession();
    session.setSession({
      access_token: "last-minute",
      expires_at: Date.now() + 45_000,
    });
    axios.post.mockRejectedValue({ response: { status: 401 } });
    jest.advanceTimersByTime(44_000);
    expect(axios.post).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    await session.refreshSession();
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
  it("clears both storage and the HTTP authorization header on logout", async () => {
    const { session, axios, instance, storage } = browserSession();
    session.setSession(token("initial"));
    axios.post.mockResolvedValue({});
    await session.logoutSession();
    expect(storage.has("Bearer")).toBe(false);
    expect(instance.defaults.headers.common.Authorization).toBeUndefined();
    expect(axios.post.mock.calls[0][0]).toContain("auth/logout");
  });
  it("rejects expired refresh sessions but preserves access during transient failures", async () => {
    const { session, axios, storage } = browserSession();
    session.setSession(token("initial"));
    axios.post.mockRejectedValue(new Error("offline"));
    await session.refreshSession();
    expect(storage.get("Bearer")).toBe("initial");
    axios.post.mockRejectedValue({ response: { status: 401 } });
    await session.refreshSession();
    expect(storage.has("Bearer")).toBe(false);
  });
  it("never restores a session from a refresh response arriving after logout", async () => {
    const { session, axios, storage } = browserSession();
    session.setSession(token("initial"));
    let finish: (value: unknown) => void;
    axios.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = session.refreshSession();
    session.clearSession();
    finish({ data: token("stale") });
    expect(await pending).toBeNull();
    expect(storage.has("Bearer")).toBe(false);
  });
});

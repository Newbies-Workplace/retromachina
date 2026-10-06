import { Subject } from "rxjs";
import { NotificationController } from "./notification.controller";

jest.mock("src/auth/jwt/JWTUser", () => ({}), { virtual: true });
jest.mock("src/auth/jwt/jwt.guard", () => ({ JwtGuard: class {} }), {
  virtual: true,
});
jest.mock("src/auth/jwt/jwtuser.decorator", () => ({ User: () => () => {} }), {
  virtual: true,
});
jest.mock("../prisma/prisma.service", () => ({ PrismaService: class {} }));

describe("notification session expiry", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance"] }));
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  const setup = () => {
    const events = new Subject<{ data: string }>();
    const access = { assertSession: jest.fn().mockResolvedValue(undefined) };
    const controller = new NotificationController(
      { subscribe: () => events } as never,
      access as never,
    );
    const user = {
      id: "u",
      auth: {
        sid: "session",
        exp: Math.floor(Date.now() / 1000) + 2,
        user: { id: "u", google_id: "g" },
      },
    };
    return { events, access, stream: controller.events(user as never) };
  };
  it("delivers authorized events and completes an idle connection at expiry", async () => {
    const { events, stream } = setup();
    const next = jest.fn();
    const complete = jest.fn();
    let delivered: () => void;
    const delivery = new Promise<void>((resolve) => {
      delivered = resolve;
    });
    stream.subscribe({
      next: (event) => {
        next(event);
        delivered();
      },
      complete,
    });
    events.next({ data: "valid" });
    await delivery;
    expect(next).toHaveBeenCalledWith({ data: "valid" });
    jest.advanceTimersByTime(2000);
    expect(complete).toHaveBeenCalledTimes(1);
    events.next({ data: "expired" });
    expect(next).toHaveBeenCalledTimes(1);
  });
  it("withholds events and closes when the session has been revoked", async () => {
    const { events, access, stream } = setup();
    const next = jest.fn();
    const complete = jest.fn();
    access.assertSession.mockRejectedValue(new Error("revoked"));
    let closed: () => void;
    const closure = new Promise<void>((resolve) => {
      closed = resolve;
    });
    stream.subscribe({
      next,
      complete: () => {
        complete();
        closed();
      },
    });
    events.next({ data: "forbidden" });
    await closure;
    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

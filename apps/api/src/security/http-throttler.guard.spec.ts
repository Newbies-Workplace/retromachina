import { Controller, Get, type INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { Throttle, ThrottlerModule } from "@nestjs/throttler";
import * as request from "supertest";
import { HttpThrottlerGuard } from "./http-throttler.guard";

@Controller("limited")
class LimitedController {
  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  @Get()
  get() {
    return { ok: true };
  }
}

describe("HttpThrottlerGuard", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [LimitedController],
      providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  it("rejects HTTP requests over the route limit with 429", async () => {
    await request(app.getHttpServer()).get("/limited").expect(200);
    await request(app.getHttpServer()).get("/limited").expect(200);
    await request(app.getHttpServer()).get("/limited").expect(429);
  });

  it("does not throttle non-HTTP contexts such as WebSocket commands", async () => {
    const guard = new HttpThrottlerGuard({} as never, {} as never, {} as never);
    const wsContext = { getType: () => "ws" } as never;

    await expect(guard.canActivate(wsContext)).resolves.toBe(true);
  });
});

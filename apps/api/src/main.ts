import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ForbiddenExceptionFilter } from "./common/ForbiddenExceptionFilter";
import { NotFoundExceptionFilter } from "./common/NotFoundExceptionFilter";

const morgan = require("morgan");

// Invite keys and other identifiers travel in query strings; keep them out of logs.
morgan.token("path", (req: { originalUrl?: string; url?: string }) =>
  (req.originalUrl ?? req.url ?? "")
    .split("?")[0]
    .replace(/\/link_invite\/[^/]+/, "/link_invite/:inviteKey"),
);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Production runs behind a reverse proxy on a private Docker network. Trust
  // forwarded client IPs only from private hops, so the rate limiter sees real
  // clients without letting public callers spoof X-Forwarded-For.
  app.set("trust proxy", "loopback, linklocal, uniquelocal");

  app.use(helmet());
  app.use(
    morgan(":method :path :status :res[content-length] - :response-time ms"),
  );
  app.setGlobalPrefix("api/rest/v1");
  // Strip properties without validation decorators. Not forbidding them keeps
  // clients that send whole response objects (e.g. board edit) working.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(
    new ForbiddenExceptionFilter(),
    new NotFoundExceptionFilter(),
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors({
    origin: new URL(process.env.CALLBACK_URL).origin,
    credentials: true,
  });

  await app.listen(3000);
}

bootstrap();

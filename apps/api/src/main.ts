import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { AppModule } from "./app.module";
import { isAllowedOrigin } from "./auth/session";
import { ForbiddenExceptionFilter } from "./common/ForbiddenExceptionFilter";
import { NotFoundExceptionFilter } from "./common/NotFoundExceptionFilter";

const morgan = require("morgan");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(morgan("tiny"));
  app.use(require("cookie-parser")());
  app.setGlobalPrefix("api/rest/v1");
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(
    new ForbiddenExceptionFilter(),
    new NotFoundExceptionFilter(),
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors({
    origin: (origin, callback) =>
      callback(null, !origin || isAllowedOrigin(origin)),
    credentials: true,
  });

  await app.listen(3000);
}

bootstrap();

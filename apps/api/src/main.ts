import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { AppModule } from "./app.module";

const morgan = require("morgan");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(morgan("tiny"));
  app.setGlobalPrefix("api/rest/v1");
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors();

  await app.listen(3000);
}

bootstrap();

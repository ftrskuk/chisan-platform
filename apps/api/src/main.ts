import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`API running on http://localhost:${port}`, "Bootstrap");
}

bootstrap().catch((error) => {
  Logger.error(`Failed to start application: ${error.message}`, "Bootstrap");
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable global validation pipes for DTOs
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // Automatically transform payloads to be instances of DTO classes
    whitelist: true, // Remove properties not defined in the DTO
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
  }));
  await app.listen(3000);
}
bootstrap();
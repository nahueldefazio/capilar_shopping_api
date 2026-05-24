import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // CORS — permite el frontend local y el de producción
  const allowedOrigins = [
    'http://localhost:4200',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // ignora propiedades no declaradas en el DTO
      forbidNonWhitelisted: false,
      transform: true,       // convierte tipos automáticamente (string → number, etc.)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://lemonchiffon-goldfish-284566.hostingersite.com',
    'https://navajowhite-quetzal-176085.hostingersite.com',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

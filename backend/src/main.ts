import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Punto de entrada de la API.
 * Configura el prefijo global, la validación automática de DTOs y CORS.
 */
async function iniciar() {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas cuelgan de /api (ej. GET /api/productos)
  app.setGlobalPrefix('api');

  // Validación global con class-validator:
  //  - whitelist: descarta propiedades que no estén declaradas en el DTO
  //  - forbidNonWhitelisted: rechaza la petición si llegan propiedades extrañas
  //  - transform: convierte el JSON plano en instancias del DTO (y castea tipos)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS: permite que el frontend (Vite, puerto 5173) consuma la API.
  app.enableCors({
    origin: process.env.ORIGEN_CORS?.split(',') ?? true,
    credentials: true,
  });

  const puerto = Number(process.env.PUERTO ?? 3000);
  await app.listen(puerto);
  Logger.log(`✅ API escuchando en http://localhost:${puerto}/api`, 'Arranque');
}

iniciar();

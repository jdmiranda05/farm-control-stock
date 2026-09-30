import { Module } from '@nestjs/common';
import { AutenticacionController } from './autenticacion.controller';

/**
 * Módulo de autenticación y autorización.
 * Los guardias (GuardiaAutenticacion y GuardiaRoles) se registran como
 * globales en AppModule; aquí solo se declara el controlador de perfil.
 */
@Module({
  controllers: [AutenticacionController],
})
export class AutenticacionModule {}

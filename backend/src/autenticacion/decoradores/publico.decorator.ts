import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos que consulta GuardiaAutenticacion. */
export const CLAVE_ES_PUBLICO = 'esPublico';

/**
 * Marca un endpoint como público (sin autenticación).
 * Ejemplo: el endpoint de salud GET /api/salud.
 */
export const Publico = () => SetMetadata(CLAVE_ES_PUBLICO, true);

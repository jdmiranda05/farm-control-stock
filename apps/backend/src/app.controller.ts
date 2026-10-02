import { Controller, Get } from '@nestjs/common';
import { Publico } from './autenticacion/decoradores/publico.decorator';

/** Endpoint de salud: permite verificar que la API está en línea. */
@Controller()
export class AppController {
  @Publico()
  @Get('salud')
  salud() {
    return {
      estado: 'en línea',
      servicio: 'API SaaS Boticas',
      fecha: new Date().toISOString(),
    };
  }
}

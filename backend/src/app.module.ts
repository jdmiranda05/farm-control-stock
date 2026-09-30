import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { GuardiaAutenticacion } from './autenticacion/guardias/guardia-autenticacion.guard';
import { GuardiaRoles } from './autenticacion/guardias/guardia-roles.guard';
import { BoticasModule } from './boticas/boticas.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ProductosModule } from './productos/productos.module';
import { KardexModule } from './kardex/kardex.module';
import { InventarioModule } from './inventario/inventario.module';
import { VentasModule } from './ventas/ventas.module';
import { ReportesModule } from './reportes/reportes.module';
import { AlertasModule } from './alertas/alertas.module';
import { PanelModule } from './panel/panel.module';

/**
 * Módulo raíz: ensambla la aplicación completa.
 *
 * Los guardias se registran como APP_GUARD (globales) en este orden:
 *   1. GuardiaAutenticacion -> valida el JWT de Supabase y carga el perfil
 *   2. GuardiaRoles         -> verifica el rol que exige cada endpoint
 * Así TODOS los endpoints requieren sesión, salvo los marcados @Publico().
 */
@Module({
  imports: [
    // Variables de entorno (.env) disponibles en toda la aplicación
    ConfigModule.forRoot({ isGlobal: true }),
    // Tareas programadas (recalcular alertas cada hora)
    ScheduleModule.forRoot(),
    SupabaseModule,
    AutenticacionModule,
    BoticasModule,
    ProveedoresModule,
    ProductosModule,
    KardexModule,
    InventarioModule,
    VentasModule,
    ReportesModule,
    AlertasModule,
    PanelModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: GuardiaAutenticacion },
    { provide: APP_GUARD, useClass: GuardiaRoles },
  ],
})
export class AppModule {}

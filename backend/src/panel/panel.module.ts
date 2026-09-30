import { Module } from '@nestjs/common';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';

/** Módulo del Dashboard (métricas y tabla de atención). */
@Module({
  controllers: [PanelController],
  providers: [PanelService],
})
export class PanelModule {}

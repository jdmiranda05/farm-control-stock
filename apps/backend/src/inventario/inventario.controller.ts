import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PerfilUsuario, RolUsuario } from '@botica/comun';
import { Roles } from '../autenticacion/decoradores/roles.decorator';
import { UsuarioActual } from '../autenticacion/decoradores/usuario-actual.decorator';
import { InventarioService } from './inventario.service';
import { RegistrarEntradaDto } from './dto/registrar-entrada.dto';
import { RegistrarMermaDto } from './dto/registrar-merma.dto';
import { FiltroLotesDto } from './dto/filtro-lotes.dto';

/**
 * Endpoints del almacén.
 *
 * Permisos:
 *   - Consultar lotes      -> cualquier rol (el vendedor necesita ver stock)
 *   - Entradas manuales    -> ALMACENERO (y ADMIN)
 *   - Declarar mermas      -> ALMACENERO (y ADMIN)
 */
@Controller('inventario')
export class InventarioController {
  constructor(private readonly servicio: InventarioService) {}

  /** GET /api/inventario/lotes?productoId=&soloVencidos=&pagina=&porPagina= */
  @Get('lotes')
  listarLotes(@UsuarioActual() usuario: PerfilUsuario, @Query() filtros: FiltroLotesDto) {
    return this.servicio.listarLotes(usuario.botica_id, filtros);
  }

  /** POST /api/inventario/entradas — recepción manual de mercadería (en cajas). */
  @Roles(RolUsuario.ALMACENERO)
  @Post('entradas')
  registrarEntrada(
    @UsuarioActual() usuario: PerfilUsuario,
    @Body() dto: RegistrarEntradaDto,
  ) {
    return this.servicio.registrarEntrada(usuario.botica_id, usuario.id, dto);
  }

  /** POST /api/inventario/mermas — declarar pérdida por vencimiento o daño. */
  @Roles(RolUsuario.ALMACENERO)
  @Post('mermas')
  registrarMerma(@UsuarioActual() usuario: PerfilUsuario, @Body() dto: RegistrarMermaDto) {
    return this.servicio.registrarMerma(usuario.botica_id, usuario.id, dto);
  }
}

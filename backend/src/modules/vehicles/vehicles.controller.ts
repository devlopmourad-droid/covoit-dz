import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Public()
  @Get('search')
  search(@Query() dto: SearchVehiclesDto) {
    return this.vehiclesService.search(dto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  myVehicles(@CurrentUser() user: any) {
    return this.vehiclesService.myVehicles(user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('owner')
  create(@CurrentUser() user: any, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vehiclesService.remove(id, user.id);
  }

  // Endpoint de modération simplifié — dans une vraie prod, réservé au rôle admin
  // avec vérification préalable des documents du véhicule.
  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  activate(@Param('id') id: string) {
    return this.vehiclesService.activate(id);
  }
}

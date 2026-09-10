import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { GeographyService } from './geography.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('geography')
export class GeographyController {
  constructor(private geoService: GeographyService) {}

  @Public()
  @Get('wilayas')
  listWilayas() {
    return this.geoService.listWilayas();
  }

  @Public()
  @Get('wilayas/:id/communes')
  listCommunes(@Param('id', ParseIntPipe) id: number) {
    return this.geoService.listCommunesByWilaya(id);
  }

  @Public()
  @Get('communes/search')
  search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return [];
    return this.geoService.searchCommunes(q.trim());
  }

  @Public()
  @Get('communes/near')
  near(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm = '20',
  ) {
    return this.geoService.communesNear(parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
  }
}

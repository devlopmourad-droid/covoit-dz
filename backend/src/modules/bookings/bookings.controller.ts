import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('renter', 'owner', 'admin')
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: any, @Query('as') as: 'renter' | 'owner' = 'renter') {
    return as === 'owner'
      ? this.bookingsService.myBookingsAsOwner(user.id)
      : this.bookingsService.myBookingsAsRenter(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.confirm(id, user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CancelBookingDto) {
    return this.bookingsService.reject(id, user.id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancel(id, user.id, dto);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.bookingsService.recordInspection(id, user.id, 'check_in', body);
  }

  @Post(':id/check-out')
  checkOut(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.bookingsService.recordInspection(id, user.id, 'check_out', body);
  }
}

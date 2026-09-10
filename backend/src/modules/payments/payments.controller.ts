import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('bookings/:bookingId/pay')
  pay(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.paymentsService.payForBooking(bookingId, user.id);
  }

  @Get('bookings/:bookingId')
  list(@Param('bookingId') bookingId: string) {
    return this.paymentsService.listForBooking(bookingId);
  }

  @Patch('bookings/:bookingId/refund-deposit')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  refundDeposit(@Param('bookingId') bookingId: string) {
    return this.paymentsService.refundDeposit(bookingId);
  }
}

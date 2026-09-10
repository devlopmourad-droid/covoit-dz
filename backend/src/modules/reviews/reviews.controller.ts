import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('bookings/:bookingId/review')
  create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    return this.reviewsService.create(bookingId, user.id, rating, comment);
  }

  @Get('vehicles/:vehicleId/reviews')
  forVehicle(@Param('vehicleId') vehicleId: string) {
    return this.reviewsService.forVehicle(vehicleId);
  }
}

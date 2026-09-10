import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bookings/:bookingId/messages')
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get()
  list(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.messagingService.listMessages(bookingId, user.id);
  }

  @Post()
  send(@Param('bookingId') bookingId: string, @CurrentUser() user: any, @Body('content') content: string) {
    return this.messagingService.sendMessage(bookingId, user.id, content);
  }
}

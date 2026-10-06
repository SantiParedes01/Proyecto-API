import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.create(
      createNotificationDto,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.findAllByUser(
      req.user.userId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.findOne(
      id,
      req.user.userId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.update(
      id,
      req.user.userId,
      updateNotificationDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.remove(
      id,
      req.user.userId,
    );
  }
}
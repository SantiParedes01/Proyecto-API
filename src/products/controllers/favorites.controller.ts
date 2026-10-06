import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from '../services/favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Post(':productId')
  create(@Param('productId') productId: string, @CurrentUser() user: JwtUserPayload) {
    return this.service.create(user.userId, productId);
  }

  @Get('me')
  findMine(@CurrentUser() user: JwtUserPayload) {
    return this.service.findMine(user.userId);
  }

  @Delete(':productId')
  remove(@Param('productId') productId: string, @CurrentUser() user: JwtUserPayload) {
    return this.service.remove(user.userId, productId);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateProductCommentDto } from '../dto/create-product-comment.dto';
import { ProductCommentsService } from '../services/product-comments.service';

@Controller('products/:id/comments')
@UseGuards(JwtAuthGuard)
export class ProductCommentsController {
  constructor(private readonly service: ProductCommentsService) {}

  @Post()
  create(@Param('id') productId: string, @Body() dto: CreateProductCommentDto, @CurrentUser() user: JwtUserPayload) {
    return this.service.create(user.userId, productId, dto);
  }

  @Get()
  findByProduct(@Param('id') productId: string) {
    return this.service.findByProduct(productId);
  }
}

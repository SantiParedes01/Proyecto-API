import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from '../../users/services/users.service';
import { CreateProductCommentDto } from '../dto/create-product-comment.dto';
import { ProductCommentResponseDto } from '../dto/product-comment-response.dto';
import type { IProductCommentsRepository } from '../repositories/product-comments.repository';
import { ProductsService } from './products.service';

@Injectable()
export class ProductCommentsService {
  constructor(
    @Inject('IProductCommentsRepository') private readonly repository: IProductCommentsRepository,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, productId: string, dto: CreateProductCommentDto): Promise<ProductCommentResponseDto> {
    await this.productsService.findActiveEntityOrThrow(productId);
    const comment = await this.repository.create(userId, productId, dto);
    return this.toResponse(comment);
  }

  async findByProduct(productId: string): Promise<ProductCommentResponseDto[]> {
    await this.productsService.findActiveEntityOrThrow(productId);
    const comments = await this.repository.findByProduct(productId);
    const result: ProductCommentResponseDto[] = [];
    for (const comment of comments) {
      const author = await this.usersService.findById(comment.userId.toString());
      result.push({
        id: comment._id.toString(),
        productId: comment.productId.toString(),
        userId: comment.userId.toString(),
        author: { id: author.id, name: author.name, surname: author.surname },
        content: comment.content,
        createdAt: (comment as any).createdAt,
        updatedAt: (comment as any).updatedAt,
      });
    }
    return result;
  }

  private toResponse(comment: any): ProductCommentResponseDto {
    return {
      id: comment._id.toString(),
      productId: comment.productId.toString(),
      userId: comment.userId.toString(),
      author: { id: comment.userId.toString(), name: '', surname: '' },
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}

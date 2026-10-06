import { Inject, Injectable } from '@nestjs/common';
import { CreateProductCommentDto } from '../dto/create-product-comment.dto';
import { ProductComment } from '../schemas/product-comment.schema';
import type { IProductCommentsDao } from '../dao/product-comments.mongoose.dao';

export interface IProductCommentsRepository {
  create(userId: string, productId: string, dto: CreateProductCommentDto): Promise<ProductComment>;
  findByProduct(productId: string): Promise<ProductComment[]>;
}

@Injectable()
export class ProductCommentsRepository implements IProductCommentsRepository {
  constructor(@Inject('IProductCommentsDao') private readonly dao: IProductCommentsDao) {}
  create(userId: string, productId: string, dto: CreateProductCommentDto) { return this.dao.create(userId, productId, dto); }
  findByProduct(productId: string) { return this.dao.findByProduct(productId); }
}

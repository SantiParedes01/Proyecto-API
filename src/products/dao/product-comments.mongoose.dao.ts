import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductCommentDto } from '../dto/create-product-comment.dto';
import { ProductComment } from '../schemas/product-comment.schema';

export interface IProductCommentsDao {
  create(userId: string, productId: string, dto: CreateProductCommentDto): Promise<ProductComment>;
  findByProduct(productId: string): Promise<ProductComment[]>;
}

@Injectable()
export class ProductCommentsMongooseDao implements IProductCommentsDao {
  constructor(@InjectModel(ProductComment.name) private readonly model: Model<ProductComment>) {}

  async create(userId: string, productId: string, dto: CreateProductCommentDto): Promise<ProductComment> {
    return new this.model({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      content: dto.content,
    }).save();
  }

  async findByProduct(productId: string): Promise<ProductComment[]> {
    return this.model.find({ productId: new Types.ObjectId(productId) }).sort({ createdAt: -1 }).exec();
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.schema';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class ProductComment extends Document {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 500 })
  content: string;
}

export const ProductCommentSchema = SchemaFactory.createForClass(ProductComment);

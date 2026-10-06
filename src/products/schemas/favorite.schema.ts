import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.schema';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Favorite extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  productId: Types.ObjectId;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

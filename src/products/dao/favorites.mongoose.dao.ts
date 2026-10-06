import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite } from '../schemas/favorite.schema';

export interface IFavoritesDao {
  create(userId: string, productId: string): Promise<Favorite>;
  remove(userId: string, productId: string): Promise<boolean>;
  findMine(userId: string): Promise<Favorite[]>;
}

@Injectable()
export class FavoritesMongooseDao implements IFavoritesDao {
  constructor(@InjectModel(Favorite.name) private readonly model: Model<Favorite>) {}

  async create(userId: string, productId: string): Promise<Favorite> {
    try {
      return await new this.model({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) }).save();
    } catch (error: any) {
      if (error?.code === 11000) throw new ConflictException('Product is already in favorites');
      throw error;
    }
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) }).exec();
    return result.deletedCount > 0;
  }

  async findMine(userId: string): Promise<Favorite[]> {
    return this.model.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }
}

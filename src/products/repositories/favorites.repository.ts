import { Inject, Injectable } from '@nestjs/common';
import { Favorite } from '../schemas/favorite.schema';
import type { IFavoritesDao } from '../dao/favorites.mongoose.dao';

export interface IFavoritesRepository {
  create(userId: string, productId: string): Promise<Favorite>;
  remove(userId: string, productId: string): Promise<boolean>;
  findMine(userId: string): Promise<Favorite[]>;
}

@Injectable()
export class FavoritesRepository implements IFavoritesRepository {
  constructor(@Inject('IFavoritesDao') private readonly dao: IFavoritesDao) {}
  create(userId: string, productId: string) { return this.dao.create(userId, productId); }
  remove(userId: string, productId: string) { return this.dao.remove(userId, productId); }
  findMine(userId: string) { return this.dao.findMine(userId); }
}

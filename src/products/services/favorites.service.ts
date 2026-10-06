import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FavoriteResponseDto } from '../dto/favorite-response.dto';
import type { IFavoritesRepository } from '../repositories/favorites.repository';
import { ProductsService } from './products.service';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject('IFavoritesRepository') private readonly repository: IFavoritesRepository,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, productId: string): Promise<FavoriteResponseDto> {
    await this.productsService.findActiveEntityOrThrow(productId);
    const favorite = await this.repository.create(userId, productId);
    return { id: favorite._id.toString(), userId: favorite.userId.toString(), productId: favorite.productId.toString(), createdAt: (favorite as any).createdAt };
  }

  async remove(userId: string, productId: string) {
    const removed = await this.repository.remove(userId, productId);
    if (!removed) throw new NotFoundException('Favorite not found');
    return { message: 'Favorite removed successfully' };
  }

  async findMine(userId: string): Promise<FavoriteResponseDto[]> {
    const favorites = await this.repository.findMine(userId);
    return favorites.map((favorite) => ({ id: favorite._id.toString(), userId: favorite.userId.toString(), productId: favorite.productId.toString(), createdAt: (favorite as any).createdAt }));
  }
}

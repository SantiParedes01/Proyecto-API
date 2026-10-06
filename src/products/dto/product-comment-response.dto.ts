export class ProductCommentResponseDto {
  id: string;
  productId: string;
  userId: string;
  author: {
    id: string;
    name: string;
    surname: string;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

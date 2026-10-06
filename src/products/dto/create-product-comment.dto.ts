import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProductCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(500)
  content: string;
}

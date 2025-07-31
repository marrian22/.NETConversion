import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class AddBookDto {
  @IsString()
  @IsNotEmpty()
  ISBN: string;

  @IsString()
  @IsNotEmpty()
  Title: string;

  @IsInt()
  AuthorId: number;

  @IsInt()
  CategoryId: number;

  @IsInt()
  PublisherId: number;
}
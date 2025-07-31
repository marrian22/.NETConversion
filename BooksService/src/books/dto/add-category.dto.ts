import { IsString, IsNotEmpty } from 'class-validator';

export class AddCategoryDto {
  @IsString()
  @IsNotEmpty()
  CategoryName: string;
}
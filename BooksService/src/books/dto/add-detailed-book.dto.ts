import { IsString, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { AddAuthorDto } from './add-author.dto';
import { AddCategoryDto } from './add-category.dto';
import { AddPublisherDto } from './add-publisher.dto';

export class AddDetailedBookDto {
  @IsString()
  @IsNotEmpty()
  ISBN: string;

  @IsString()
  @IsNotEmpty()
  Title: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddAuthorDto)
  Author: AddAuthorDto;

  @IsObject()
  @ValidateNested()
  @Type(() => AddCategoryDto)
  Category: AddCategoryDto;

  @IsObject()
  @ValidateNested()
  @Type(() => AddPublisherDto)
  Publisher: AddPublisherDto;
}
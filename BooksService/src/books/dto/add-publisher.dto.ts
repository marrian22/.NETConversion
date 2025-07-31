import { IsString, IsNotEmpty } from 'class-validator';

export class AddPublisherDto {
  @IsString()
  @IsNotEmpty()
  PublisherName: string;
}
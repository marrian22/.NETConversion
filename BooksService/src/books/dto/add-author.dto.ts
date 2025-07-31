import { IsString, IsNotEmpty } from 'class-validator';

export class AddAuthorDto {
  @IsString()
  @IsNotEmpty()
  FirstName: string;

  @IsString()
  @IsNotEmpty()
  LastName: string;
}
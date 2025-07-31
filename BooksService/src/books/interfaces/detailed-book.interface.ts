import { Author } from './author.interface';
import { Category } from './category.interface';
import { Publisher } from './publisher.interface';

export interface DetailedBook {
  ISBN: string;
  Title: string;
  Author: Author;
  Category: Category;
  Publisher: Publisher;
}
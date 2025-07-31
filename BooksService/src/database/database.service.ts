import { Injectable } from '@nestjs/common';
import { Author } from '../books/interfaces/author.interface';
import { Book } from '../books/interfaces/book.interface';
import { Category } from '../books/interfaces/category.interface';
import { Publisher } from '../books/interfaces/publisher.interface';
import { AddAuthorDto } from 'src/books/dto/add-author.dto';
import { AddBookDto } from 'src/books/dto/add-book.dto';
import { AddCategoryDto } from 'src/books/dto/add-category.dto';
import { AddPublisherDto } from 'src/books/dto/add-publisher.dto';

/**
 * This is a mock database service to simulate the DbHelper functionality.
 * In a real application, this would interact with a database (e.g., via TypeORM, Prisma, etc.).
 */
@Injectable()
export class DatabaseService {
  private authors: Author[] = [
    { AuthorId: 1, FirstName: 'John', LastName: 'Doe' },
    { AuthorId: 2, FirstName: 'Jane', LastName: 'Smith' },
  ];
  private nextAuthorId = 3;

  private categories: Category[] = [
    { CategoryId: 101, CategoryName: 'Fiction' },
    { CategoryId: 102, CategoryName: 'Science' },
  ];
  private nextCategoryId = 103;

  private publishers: Publisher[] = [
    { PublisherId: 201, PublisherName: 'Penguin' },
    { PublisherId: 202, PublisherName: 'Random House' },
  ];
  private nextPublisherId = 203;

  private books: Book[] = [
    { ISBN: '978-0321765723', Title: 'The Great Nest', AuthorId: 1, CategoryId: 101, PublisherId: 201 },
    { ISBN: '978-0134494166', Title: 'NestJS in Action', AuthorId: 2, CategoryId: 102, PublisherId: 202 },
  ];

  async getAuthors(): Promise<Author[]> {
    return this.authors;
  }

  async addAuthor(authorDto: AddAuthorDto): Promise<void> {
    const newAuthor: Author = {
      AuthorId: this.nextAuthorId++,
      FirstName: authorDto.FirstName,
      LastName: authorDto.LastName,
    };
    this.authors.push(newAuthor);
  }

  async getAuthorById(id: number): Promise<Author | undefined> {
    return this.authors.find(a => a.AuthorId === id);
  }

  async getAuthorIdByName(firstName: string, lastName: string): Promise<number | undefined> {
    const author = this.authors.find(a => a.FirstName === firstName && a.LastName === lastName);
    return author ? author.AuthorId : undefined;
  }

  async getBooks(): Promise<Book[]> {
    return this.books;
  }

  async addBook(bookDto: AddBookDto): Promise<void> {
    const newBook: Book = {
      ISBN: bookDto.ISBN,
      Title: bookDto.Title,
      AuthorId: bookDto.AuthorId,
      CategoryId: bookDto.CategoryId,
      PublisherId: bookDto.PublisherId,
    };
    this.books.push(newBook);
  }

  async getCategories(): Promise<Category[]> {
    return this.categories;
  }

  async addCategory(categoryDto: AddCategoryDto): Promise<void> {
    const newCategory: Category = {
      CategoryId: this.nextCategoryId++,
      CategoryName: categoryDto.CategoryName,
    };
    this.categories.push(newCategory);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.find(c => c.CategoryId === id);
  }

  async getCategoryIdByName(categoryName: string): Promise<number | undefined> {
    const category = this.categories.find(c => c.CategoryName === categoryName);
    return category ? category.CategoryId : undefined;
  }

  async getPublishers(): Promise<Publisher[]> {
    return this.publishers;
  }

  async addPublisher(publisherDto: AddPublisherDto): Promise<void> {
    const newPublisher: Publisher = {
      PublisherId: this.nextPublisherId++,
      PublisherName: publisherDto.PublisherName,
    };
    this.publishers.push(newPublisher);
  }

  async getPublisherById(id: number): Promise<Publisher | undefined> {
    return this.publishers.find(p => p.PublisherId === id);
  }

  async getPublisherIdByName(publisherName: string): Promise<number | undefined> {
    const publisher = this.publishers.find(p => p.PublisherName === publisherName);
    return publisher ? publisher.PublisherId : undefined;
  }
}
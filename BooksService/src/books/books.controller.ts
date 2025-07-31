import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BooksService } from './books.service';
import { Author } from './interfaces/author.interface';
import { Book } from './interfaces/book.interface';
import { DetailedBook } from './interfaces/detailed-book.interface';
import { Category } from './interfaces/category.interface';
import { Publisher } from './interfaces/publisher.interface';
import { AddAuthorDto } from './dto/add-author.dto';
import { AddDetailedBookDto } from './dto/add-detailed-book.dto';
import { AddCategoryDto } from './dto/add-category.dto';
import { AddPublisherDto } from './dto/add-publisher.dto';

// The WCF Service Name was BooksService, exposed as IBooksService.
// NestJS Controller will serve as the entry point for API requests.
// Base path for the WCF service was often relative to the application,
// here we'll use a common root 'books' or keep it flat as per UriTemplate.
// Given the UriTemplates, 'BooksService' effectively served as the root.
// For example, 'Authors' becomes '/Authors'.
@Controller() // Keeping the controller root empty allows UriTemplate to be absolute paths
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // Author start
  @Get('Authors')
  async getAuthorList(): Promise<Author[]> {
    return this.booksService.getAuthorList();
  }

  @Post('AddAuthor')
  @HttpCode(HttpStatus.OK) // WCF void methods usually return 200 OK
  async addAuthor(@Body() author: AddAuthorDto): Promise<void> {
    await this.booksService.addAuthor(author);
  }
  // Author end

  // Book start
  @Get('Books')
  async getBookList(): Promise<Book[]> {
    return this.booksService.getBookList();
  }
  // Book end

  // DetailedBook start
  @Get('DetailedBooks')
  async getDetailedBookList(): Promise<DetailedBook[]> {
    return this.booksService.getDetailedBookList();
  }

  @Post('AddDetailedBook')
  @HttpCode(HttpStatus.OK) // WCF void methods usually return 200 OK
  async addDetailedBook(@Body() detailedBook: AddDetailedBookDto): Promise<void> {
    await this.booksService.addDetailedBook(detailedBook);
  }
  // DetailedBook end

  // Category start
  @Get('Categories')
  async getCategoryList(): Promise<Category[]> {
    return this.booksService.getCategoryList();
  }

  @Post('AddCategory')
  @HttpCode(HttpStatus.OK) // WCF void methods usually return 200 OK
  async addCategory(@Body() category: AddCategoryDto): Promise<void> {
    await this.booksService.addCategory(category);
  }
  // Category end

  // Publisher start
  @Get('Publishers')
  async getPublisherList(): Promise<Publisher[]> {
    return this.booksService.getPublisherList();
  }

  @Post('AddPublisher')
  @HttpCode(HttpStatus.OK) // WCF void methods usually return 200 OK
  async addPublisher(@Body() publisher: AddPublisherDto): Promise<void> {
    await this.booksService.addPublisher(publisher);
  }
  // Publisher end
}
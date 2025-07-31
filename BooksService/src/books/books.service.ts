import { Injectable, NotFoundException } from '@nestjs/common';
import { Author } from './interfaces/author.interface';
import { Book } from './interfaces/book.interface';
import { Category } from './interfaces/category.interface';
import { Publisher } from './interfaces/publisher.interface';
import { DetailedBook } from './interfaces/detailed-book.interface';
import { DatabaseService } from 'src/database/database.service';
import { AddAuthorDto } from './dto/add-author.dto';
import { AddCategoryDto } from './dto/add-category.dto';
import { AddPublisherDto } from './dto/add-publisher.dto';
import { AddBookDto } from './dto/add-book.dto';
import { AddDetailedBookDto } from './dto/add-detailed-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly dbService: DatabaseService) {}

  // Author start
  async getAuthorList(): Promise<Author[]> {
    return this.dbService.getAuthors();
  }

  async addAuthor(author: AddAuthorDto): Promise<void> {
    await this.dbService.addAuthor(author);
  }
  // Author end

  // Book start
  async getBookList(): Promise<Book[]> {
    return this.dbService.getBooks();
  }

  // AddBook is not exposed via WCF WebInvoke, but called internally
  async addBook(book: AddBookDto): Promise<void> {
    await this.dbService.addBook(book);
  }
  // Book end

  // DetailedBook start
  async getDetailedBookList(): Promise<DetailedBook[]> {
    const books = await this.dbService.getBooks();
    const detailedBooks: DetailedBook[] = [];

    for (const book of books) {
      const author = await this.dbService.getAuthorById(book.AuthorId);
      const category = await this.dbService.getCategoryById(book.CategoryId);
      const publisher = await this.dbService.getPublisherById(book.PublisherId);

      if (!author || !category || !publisher) {
        // Handle case where related data is not found (e.g., log, throw error, or skip)
        console.warn(`Skipping book ${book.ISBN} due to missing related data.`);
        continue;
      }

      detailedBooks.push({
        ISBN: book.ISBN,
        Title: book.Title,
        Author: author,
        Category: category,
        Publisher: publisher,
      });
    }
    return detailedBooks;
  }

  async addDetailedBook(detailedBook: AddDetailedBookDto): Promise<void> {
    let authorId = await this.dbService.getAuthorIdByName(
      detailedBook.Author.FirstName,
      detailedBook.Author.LastName,
    );
    if (!authorId) {
      await this.dbService.addAuthor(detailedBook.Author);
      authorId = await this.dbService.getAuthorIdByName(
        detailedBook.Author.FirstName,
        detailedBook.Author.LastName,
      );
      if (!authorId) throw new Error('Failed to get author ID after creation.');
    }

    let publisherId = await this.dbService.getPublisherIdByName(detailedBook.Publisher.PublisherName);
    if (!publisherId) {
      await this.dbService.addPublisher(detailedBook.Publisher);
      publisherId = await this.dbService.getPublisherIdByName(detailedBook.Publisher.PublisherName);
      if (!publisherId) throw new Error('Failed to get publisher ID after creation.');
    }

    let categoryId = await this.dbService.getCategoryIdByName(detailedBook.Category.CategoryName);
    if (!categoryId) {
      await this.dbService.addCategory(detailedBook.Category);
      categoryId = await this.dbService.getCategoryIdByName(detailedBook.Category.CategoryName);
      if (!categoryId) throw new Error('Failed to get category ID after creation.');
    }

    const bookToAdd: AddBookDto = {
      ISBN: detailedBook.ISBN,
      Title: detailedBook.Title,
      AuthorId: authorId,
      PublisherId: publisherId,
      CategoryId: categoryId,
    };

    await this.addBook(bookToAdd);
  }
  // DetailedBook end

  // Category start
  async getCategoryList(): Promise<Category[]> {
    return this.dbService.getCategories();
  }

  async addCategory(category: AddCategoryDto): Promise<void> {
    await this.dbService.addCategory(category);
  }
  // Category end

  // Publisher start
  async getPublisherList(): Promise<Publisher[]> {
    return this.dbService.getPublishers();
  }

  async addPublisher(publisher: AddPublisherDto): Promise<void> {
    await this.dbService.addPublisher(publisher);
  }
  // Publisher end
}
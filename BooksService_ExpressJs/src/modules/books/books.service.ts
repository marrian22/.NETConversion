import { DbService } from '../../database/db.service';
import { Author, Book, DetailedBook, Category, Publisher, DbRow } from '../../models/data-contracts';

/**
 * BooksService: Contains the core business logic for book-related operations.
 * This class replaces the C# BooksService implementation.
 * It interacts with the DbService to perform database operations.
 */
export class BooksService {
    private dbHelper: DbService;

    constructor() {
        this.dbHelper = new DbService();
    }

    // Author operations
    public async getAuthorList(): Promise<Author[]> {
        const dt = await this.dbHelper.getResultSet("SELECT id, first_name, last_name FROM Author;");
        return dt.map(dr => ({
            AuthorId: dr["id"],
            FirstName: dr["first_name"],
            LastName: dr["last_name"]
        }));
    }

    public async addAuthor(author: Author): Promise<void> {
        const sql = `INSERT INTO Author (first_name, last_name) VALUES ('${author.FirstName}', '${author.LastName}');`;
        await this.dbHelper.sqlExecute(sql);
    }

    // Book operations
    public async getBookList(): Promise<Book[]> {
        const dt = await this.dbHelper.getResultSet("SELECT isbn, title, author_id, category_id, publisher_id FROM Book;");
        return dt.map(dr => ({
            ISBN: dr["isbn"],
            Title: dr["title"],
            AuthorId: dr["author_id"],
            CategoryId: dr["category_id"],
            PublisherId: dr["publisher_id"]
        }));
    }

    // This method was internal in C# implementation, used by AddDetailedBook
    private async addBook(book: Book): Promise<void> {
        const sql = `INSERT INTO Book (isbn, title, author_id, category_id, publisher_id) VALUES (
            '${book.ISBN}', '${book.Title}', ${book.AuthorId}, ${book.CategoryId}, ${book.PublisherId}
        );`;
        await this.dbHelper.sqlExecute(sql);
    }

    // DetailedBook operations
    public async getDetailedBookList(): Promise<DetailedBook[]> {
        const dt = await this.dbHelper.getResultSet("SELECT isbn, title, author_id, category_id, publisher_id FROM Book;");
        const detailedBooks: DetailedBook[] = [];

        // Using Promise.all for concurrent lookups to optimize performance
        await Promise.all(dt.map(async (dr) => {
            const author = await this.getAuthorById(dr["author_id"]);
            const category = await this.getCategoryById(dr["category_id"]);
            const publisher = await this.getPublisherById(dr["publisher_id"]);

            detailedBooks.push({
                ISBN: dr["isbn"],
                Title: dr["title"],
                Author: author!, // Use ! as we expect these to be found based on existing book data
                Category: category!,
                Publisher: publisher!
            });
        }));
        return detailedBooks;
    }

    public async addDetailedBook(detailedBook: DetailedBook): Promise<void> {
        let authorId = await this.getAuthorIdByName(detailedBook.Author.FirstName, detailedBook.Author.LastName);
        if (authorId === 0) {
            await this.addAuthor(detailedBook.Author);
            authorId = await this.getAuthorIdByName(detailedBook.Author.FirstName, detailedBook.Author.LastName); // Re-fetch ID
        }

        let publisherId = await this.getPublisherIdByName(detailedBook.Publisher.PublisherName);
        if (publisherId === 0) {
            await this.addPublisher(detailedBook.Publisher);
            publisherId = await this.getPublisherIdByName(detailedBook.Publisher.PublisherName); // Re-fetch ID
        }

        let categoryId = await this.getCategoryIdByName(detailedBook.Category.CategoryName);
        if (categoryId === 0) {
            await this.addCategory(detailedBook.Category);
            categoryId = await this.getCategoryIdByName(detailedBook.Category.CategoryName); // Re-fetch ID
        }

        const book: Book = {
            ISBN: detailedBook.ISBN,
            Title: detailedBook.Title,
            AuthorId: authorId,
            PublisherId: publisherId,
            CategoryId: categoryId
        };

        await this.addBook(book);
    }

    // Category operations
    public async getCategoryList(): Promise<Category[]> {
        const dt = await this.dbHelper.getResultSet("SELECT id, category_name FROM Category;");
        return dt.map(dr => ({
            CategoryId: dr["id"],
            CategoryName: dr["category_name"]
        }));
    }

    public async addCategory(category: Category): Promise<void> {
        const sql = `INSERT INTO Category (category_name) VALUES ('${category.CategoryName}');`;
        await this.dbHelper.sqlExecute(sql);
    }

    // Publisher operations
    public async getPublisherList(): Promise<Publisher[]> {
        const dt = await this.dbHelper.getResultSet("SELECT id, publisher_name FROM Publisher;");
        return dt.map(dr => ({
            PublisherId: dr["id"],
            PublisherName: dr["publisher_name"]
        }));
    }

    public async addPublisher(publisher: Publisher): Promise<void> {
        const sql = `INSERT INTO Publisher (publisher_name) VALUES ('${publisher.PublisherName}');`;
        await this.dbHelper.sqlExecute(sql);
    }

    // Service helper methods (private to this service)
    private async getAuthorById(authorId: number): Promise<Author | null> {
        const dt = await this.dbHelper.getResultSet(`SELECT id, first_name, last_name FROM Author WHERE id = ${authorId}`);
        if (dt.length > 0) {
            const dr = dt[0];
            return {
                AuthorId: dr["id"],
                FirstName: dr["first_name"],
                LastName: dr["last_name"]
            };
        }
        return null;
    }

    private async getCategoryById(categoryId: number): Promise<Category | null> {
        const dt = await this.dbHelper.getResultSet(`SELECT id, category_name FROM Category WHERE id = ${categoryId}`);
        if (dt.length > 0) {
            const dr = dt[0];
            return {
                CategoryId: dr["id"],
                CategoryName: dr["category_name"]
            };
        }
        return null;
    }

    private async getPublisherById(publisherId: number): Promise<Publisher | null> {
        const dt = await this.dbHelper.getResultSet(`SELECT id, publisher_name FROM Publisher WHERE id = ${publisherId}`);
        if (dt.length > 0) {
            const dr = dt[0];
            return {
                PublisherId: dr["id"],
                PublisherName: dr["publisher_name"]
            };
        }
        return null;
    }

    private async getAuthorIdByName(firstName: string, lastName: string): Promise<number> {
        const dt = await this.dbHelper.getResultSet(`SELECT id FROM Author WHERE first_name = '${firstName}' AND last_name = '${lastName}'`);
        if (dt.length > 0) {
            return dt[0]["id"];
        }
        return 0;
    }

    private async getCategoryIdByName(categoryName: string): Promise<number> {
        const dt = await this.dbHelper.getResultSet(`SELECT id FROM Category WHERE category_name = '${categoryName}'`);
        if (dt.length > 0) {
            return dt[0]["id"];
        }
        return 0;
    }

    private async getPublisherIdByName(publisherName: string): Promise<number> {
        const dt = await this.dbHelper.getResultSet(`SELECT id FROM Publisher WHERE publisher_name = '${publisherName}'`);
        if (dt.length > 0) {
            return dt[0]["id"];
        }
        return 0;
    }
}

import { Request, Response, Router } from 'express';
import { BooksService } from './books.service';
import { Author, DetailedBook, Category, Publisher } from '../../models/data-contracts';

/**
 * BooksController: Handles incoming HTTP requests and delegates to the BooksService.
 * This class replaces the WCF ServiceContract and its operation mappings.
 */
export class BooksController {
    public router: Router;
    private booksService: BooksService;

    constructor() {
        this.booksService = new BooksService();
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Author routes
        this.router.get('/authors', this.getAuthorList);
        this.router.post('/addAuthor', this.addAuthor);

        // Book routes
        this.router.get('/books', this.getBookList);

        // DetailedBook routes
        this.router.get('/detailedBooks', this.getDetailedBookList);
        this.router.post('/addDetailedBook', this.addDetailedBook);

        // Category routes
        this.router.get('/categories', this.getCategoryList);
        this.router.post('/addCategory', this.addCategory);

        // Publisher routes
        this.router.get('/publishers', this.getPublisherList);
        this.router.post('/addPublisher', this.addPublisher);
    }

    // Author endpoints
    public getAuthorList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const authors = await this.booksService.getAuthorList();
            return res.status(200).json(authors);
        } catch (error: any) {
            console.error('Error fetching author list:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    public addAuthor = async (req: Request, res: Response): Promise<Response> => {
        try {
            const author: Author = req.body; // Expects JSON body to match Author interface
            if (!author || !author.FirstName || !author.LastName) {
                return res.status(400).json({ message: 'Invalid author data provided.' });
            }
            await this.booksService.addAuthor(author);
            return res.status(201).json({ message: 'Author added successfully.' });
        } catch (error: any) {
            console.error('Error adding author:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    // Book endpoints
    public getBookList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const books = await this.booksService.getBookList();
            return res.status(200).json(books);
        } catch (error: any) {
            console.error('Error fetching book list:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    // DetailedBook endpoints
    public getDetailedBookList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const detailedBooks = await this.booksService.getDetailedBookList();
            return res.status(200).json(detailedBooks);
        } catch (error: any) {
            console.error('Error fetching detailed book list:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    public addDetailedBook = async (req: Request, res: Response): Promise<Response> => {
        try {
            const detailedBook: DetailedBook = req.body; // Expects JSON body to match DetailedBook interface
            // Basic validation: ensure essential fields exist
            if (!detailedBook || !detailedBook.ISBN || !detailedBook.Title || !detailedBook.Author || !detailedBook.Category || !detailedBook.Publisher) {
                return res.status(400).json({ message: 'Invalid detailed book data provided. Missing ISBN, Title, Author, Category, or Publisher.' });
            }
            await this.booksService.addDetailedBook(detailedBook);
            return res.status(201).json({ message: 'Detailed book added successfully.' });
        } catch (error: any) {
            console.error('Error adding detailed book:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    // Category endpoints
    public getCategoryList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const categories = await this.booksService.getCategoryList();
            return res.status(200).json(categories);
        } catch (error: any) {
            console.error('Error fetching category list:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    public addCategory = async (req: Request, res: Response): Promise<Response> => {
        try {
            const category: Category = req.body; // Expects JSON body to match Category interface
            if (!category || !category.CategoryName) {
                return res.status(400).json({ message: 'Invalid category data provided.' });
            }
            await this.booksService.addCategory(category);
            return res.status(201).json({ message: 'Category added successfully.' });
        } catch (error: any) {
            console.error('Error adding category:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    // Publisher endpoints
    public getPublisherList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const publishers = await this.booksService.getPublisherList();
            return res.status(200).json(publishers);
        } catch (error: any) {
            console.error('Error fetching publisher list:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };

    public addPublisher = async (req: Request, res: Response): Promise<Response> => {
        try {
            const publisher: Publisher = req.body; // Expects JSON body to match Publisher interface
            if (!publisher || !publisher.PublisherName) {
                return res.status(400).json({ message: 'Invalid publisher data provided.' });
            }
            await this.booksService.addPublisher(publisher);
            return res.status(201).json({ message: 'Publisher added successfully.' });
        } catch (error: any) {
            console.error('Error adding publisher:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    };
}

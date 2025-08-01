import { BooksController } from './books.controller';

/**
 * BooksModule: Represents a logical grouping of routes for the BooksService.
 * This can be seen as the equivalent of a WCF service host for a specific service.
 * It initializes the BooksController and exposes its router.
 */
export const booksRouter = new BooksController().router;

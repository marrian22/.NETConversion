import express, { Application, Request, Response, NextFunction } from 'express';
import { booksRouter } from './modules/books';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = '/BooksService.svc'; // Mimicking WCF .svc endpoint path

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies (if needed for other routes)
app.use(express.urlencoded({ extended: true }));

// Log incoming requests (optional)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Register the Books service routes under the specified base path
// The original WCF service was hosted at /BooksService.svc
// So, a request to /BooksService.svc/Authors in WCF will now be /BooksService.svc/Authors in Express.
app.use(BASE_PATH, booksRouter);

// Health check or root path handler
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('BooksService is running.');
});

// Catch-all for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: `Route Not Found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Books Service available at http://localhost:${PORT}${BASE_PATH}`);
    console.log(`Example GET: http://localhost:${PORT}${BASE_PATH}/Authors`);
    console.log(`Example POST: http://localhost:${PORT}${BASE_PATH}/AddAuthor with JSON body: {"FirstName": "Test", "LastName": "Author"}`);
});

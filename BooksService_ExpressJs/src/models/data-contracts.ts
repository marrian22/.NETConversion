export interface Author {
    AuthorId: number;
    FirstName: string;
    LastName: string;
}

export interface Book {
    ISBN: string;
    Title: string;
    AuthorId: number;
    CategoryId: number;
    PublisherId: number;
}

export interface DetailedBook {
    ISBN: string;
    Title: string;
    Author: Author;
    Category: Category;
    Publisher: Publisher;
}

export interface Category {
    CategoryId: number;
    CategoryName: string;
}

export interface Publisher {
    PublisherId: number;
    PublisherName: string;
}

// Mimicking C# DataTable structure for result sets if needed,
// but typically Node.js DB drivers return array of objects.
// For simplicity, we'll directly map DB rows to our interfaces.
export interface DbRow {
    [key: string]: any;
}

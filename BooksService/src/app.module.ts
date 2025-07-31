import { Module } from '@nestjs/common';
import { BooksController } from './books/books.controller';
import { BooksService } from './books/books.service';
import { BooksModule } from './books/books.module'; // Import your new BooksModule
import { DatabaseModule } from './database/database.module'; // Import DatabaseModule here as well

@Module({
  imports: [BooksModule, DatabaseModule], // Add BooksModule to the imports array
  controllers: [BooksController],
  providers: [BooksService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { DatabaseModule } from 'src/database/database.module'; // Import the mock database module

@Module({
  imports: [DatabaseModule], // Import DatabaseModule to make DatabaseService available
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
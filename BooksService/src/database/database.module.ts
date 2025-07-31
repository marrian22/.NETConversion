import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], // Export DatabaseService so it can be injected into other modules
})
export class DatabaseModule {}
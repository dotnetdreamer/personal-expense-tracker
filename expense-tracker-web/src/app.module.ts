import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Category } from './modules/category/category.entity';
import { CategoryModule } from './modules/category/category.module';
import { Expense } from './modules/expense/expense.entity';
import { ExpenseModule } from './modules/expense/expense.module';
import { SharedModule } from './modules/shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'expense-tracker.db',
      entities: [Category, Expense],
      synchronize: true,
    }),
    SharedModule,
    CategoryModule,
    ExpenseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

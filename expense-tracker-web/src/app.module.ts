import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Category } from './modules/category/category.entity';
import { CategoryModule } from './modules/category/category.module';
import { Expense } from './modules/expense/expense.entity';
import { ExpenseModule } from './modules/expense/expense.module';
import { SharedModule } from './modules/shared/shared.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { Attachment } from './modules/attachment/attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './_db/expense-tracker.db',
      entities: [Category, Expense, Attachment],
      synchronize: true,
    }),
    SharedModule,
    CategoryModule,
    ExpenseModule,
    AttachmentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

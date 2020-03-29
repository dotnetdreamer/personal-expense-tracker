import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpenseService } from './expense.service';
import { Expense } from './expense.entity';
import { ExpenseController } from './expense.controller';
import { AttachmentModule } from '../attachment/attachment.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense]),
    AttachmentModule,
    CategoryModule
  ],
  providers: [ExpenseService],
  controllers: [ExpenseController],
  exports: [ ExpenseService ]
})
export class ExpenseModule {}
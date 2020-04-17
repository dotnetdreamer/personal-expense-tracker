import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpenseService } from './expense.service';
import { Expense } from './expense.entity';
import { ExpenseController } from './expense.controller';
import { AttachmentModule } from '../attachment/attachment.module';
import { CategoryModule } from '../category/category.module';
import { GroupModule } from '../group/group.module';
import { ExpenseTransaction } from './expense.transaction.entity';
import { UserModule } from '../user/user.module';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { Category } from '../category/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseTransaction, User, Group, Category]),
    AttachmentModule,
    CategoryModule,
    GroupModule,
    UserModule
  ],
  providers: [ExpenseService],
  controllers: [ExpenseController],
  exports: [ ExpenseService ]
})
export class ExpenseModule {}
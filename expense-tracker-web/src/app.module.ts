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
import { MlModule } from './modules/ml/ml.module';
import { UserModule } from './modules/user/user.module';
import { User } from './modules/user/user.entity';
import { AuthModule } from './modules/user/auth/auth.module';
import { TokenModule } from './modules/user/token/token.module';
import { AccessToken } from './modules/user/token/token.entity';
import { ExternalAuth } from './modules/user/external-auth/external-auth.entity';
import { ExternalAuthModule } from './modules/user/external-auth/external-auth.module';
import { Group } from './modules/group/group.entity';
import { GroupModule } from './modules/group/group.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './_db/expense-tracker.db',
      entities: [Category, Expense, Attachment, User, AccessToken, ExternalAuth, Group],
      synchronize: true,
    }),
    SharedModule,
    CategoryModule,
    ExpenseModule,
    AttachmentModule,
    MlModule,
    UserModule,
    AuthModule,
    TokenModule,
    ExternalAuthModule,
    GroupModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

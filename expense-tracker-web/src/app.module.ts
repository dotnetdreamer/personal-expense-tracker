import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

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
import { GroupMember } from './modules/group/group-member.entity';
import { ExpenseTransaction } from './modules/expense/expense.transaction.entity';
import { GroupPeriod } from './modules/group/group-period.entity';
import { Connection, createConnection, getConnection } from 'typeorm';

const CONNECTION_NAME = "default";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      name: CONNECTION_NAME,
      type: 'sqlite',
      database: './_db/expense-tracker.db',
      entities: [
        Category, Expense, ExpenseTransaction
        , Attachment, User
        , AccessToken, ExternalAuth
        , Group, GroupMember, GroupPeriod
      ],
      synchronize: false,
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
export class AppModule {
  constructor() {
    // setTimeout(async () => {
    //   let connection: Connection;
    //   try {
    //     connection = getConnection(CONNECTION_NAME);
    //   } catch (error) {
    //     await createConnection(CONNECTION_NAME);
    //   }

    //   //do migration manually. As synchronize: true is causing issues
    //   await this.fixedSync(connection);
    // }, 0);
  }

  //https://github.com/typeorm/typeorm/issues/2576#issuecomment-499506647
  async fixedSync(connection: Connection) {
    try {
      await connection.query('PRAGMA foreign_keys=OFF;');
      await connection.synchronize();
      await connection.query('PRAGMA foreign_keys=ON');
    } catch(e) {
      console.log(e);
    }
  }
}

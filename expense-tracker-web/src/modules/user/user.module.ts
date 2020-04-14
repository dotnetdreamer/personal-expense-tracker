import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ExternalAuthModule } from './external-auth/external-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ExternalAuthModule
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
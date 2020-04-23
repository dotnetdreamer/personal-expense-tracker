import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupService } from './group.service';
import { Group } from './group.entity';
import { GroupController } from './group.controller';
import { UserModule } from '../user/user.module';
import { GroupMember } from './group-member.entity';
import { User } from '../user/user.entity';
import { GroupPeriod } from './group-period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, GroupPeriod, User]),
    UserModule
  ],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService]
})
export class GroupModule {}
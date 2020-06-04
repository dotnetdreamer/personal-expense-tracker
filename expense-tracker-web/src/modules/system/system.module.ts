import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailAccount } from './email-account';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { SchedularService } from './schedular.service';
import { QueuedMessage } from './queued-message.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount, QueuedMessage]),  
],
  providers: [SystemService, SchedularService],
  controllers: [SystemController],
  exports: [SystemService, SchedularService]
})
export class SystemModule {}
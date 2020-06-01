import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailAccount } from './email-account';
import { SystemService } from './system.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([EmailAccount]),  
],
  providers: [SystemService],
  controllers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}
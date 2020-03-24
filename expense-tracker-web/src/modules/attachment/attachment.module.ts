import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentController } from './attachment.controller';


@Module({
//   imports: [TypeOrmModule.forFeature([Category])],
  providers: [],
  controllers: [AttachmentController],
  exports: [  ]
})
export class AttachmentModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentController } from './attachment.controller';
import { MulterModule } from '@nestjs/platform-express';


@Module({
//   imports: [TypeOrmModule.forFeature([Category])],
  imports: [MulterModule.register({
    dest: './files',
  })],
  providers: [],
  controllers: [AttachmentController],
  exports: [  ]
})
export class AttachmentModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentController } from './attachment.controller';
import { MulterModule } from '@nestjs/platform-express';
import { Attachment } from './attachment.entity';
import { AttachmentService } from './attachment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment])
  , MulterModule.register({ dest: './_uploaded' })],
  providers: [ AttachmentService ],
  controllers: [AttachmentController],
  exports: [ AttachmentService ]
})
export class AttachmentModule {}
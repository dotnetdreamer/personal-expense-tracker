import { Controller, Get, Query, Body, Post, UseInterceptors, ClassSerializerInterceptor, UploadedFiles, Req, UploadedFile } from '@nestjs/common';

import { FilesInterceptor, AnyFilesInterceptor, FileInterceptor, MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer';

import { Request } from 'express';
import { IAttachment } from './attachment.model';
import { imageFileFilter, editFileName } from './attachment.utils';


@Controller('attachment')
export class AttachmentController {
  constructor() {}

//   @UseInterceptors(ClassSerializerInterceptor)
//   @Get('getAll')
//   getAll() {
//     return this.categorySvc.findAll();
//   }


    // @UseInterceptors(AnyFilesInterceptor())
    // async sync(@UploadedFiles() attachment) {
    // sync(@Req() request: Request, @UploadedFile() file) {
    // @UseInterceptors(AnyFilesInterceptor())
    @Post('sync')   
    @UseInterceptors(FilesInterceptor('files[]', 10, {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter
    }))    
    sync(@Req() request: Request
      , @UploadedFiles() files: Array<{ fieldname, originalname, mimetype, buffer, size }>) {
      const attachments = <IAttachment[]>request.body.attachments;
    }
}

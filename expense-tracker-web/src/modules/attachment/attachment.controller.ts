import { Controller, Get, Query, Body, Post, UseInterceptors, ClassSerializerInterceptor, UploadedFiles, Req } from '@nestjs/common';

// import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express'
import { Request } from 'express';

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
    @Post('sync')   
    sync(@Req() request: Request) {
        console.log(request.headers);
    }
}
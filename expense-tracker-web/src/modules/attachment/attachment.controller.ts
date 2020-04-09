import { Controller, Get, Query, Body, Post, UseInterceptors, ClassSerializerInterceptor, UploadedFiles, Req, UploadedFile, UseGuards } from '@nestjs/common';

import { FilesInterceptor, AnyFilesInterceptor, FileInterceptor, MulterModule } from '@nestjs/platform-express'
import { diskStorage } from 'multer';

import { Request } from 'express';
import { IAttachmentParams } from './attachment.model';
import { imageFileFilter, editFileName } from './attachment.utils';
import { Attachment } from './attachment.entity';
import { AttachmentService } from './attachment.service';
import { JwtAuthGuard } from '../user/auth/jwt-auth.guard';


@Controller('attachment')
export class AttachmentController {
  constructor(private attachmentSvc: AttachmentService) {

  }

//   @UseInterceptors(ClassSerializerInterceptor)
//   @Get('getAll')
//   getAll() {
//     return this.categorySvc.findAll();
//   }


    // @UseInterceptors(AnyFilesInterceptor())
    // async sync(@UploadedFiles() attachment) {
    // sync(@Req() request: Request, @UploadedFile() file) {
    // @UseInterceptors(AnyFilesInterceptor())
    @UseGuards(JwtAuthGuard)
    @Post('sync')   
    @UseInterceptors(FilesInterceptor('files[]', 10, {
      storage: diskStorage({
        destination: './_uploaded',
        filename: editFileName,
      }),
      // fileFilter: imageFileFilter
    }),
    ClassSerializerInterceptor)    
    async sync(@Req() request: Request
      , @UploadedFiles() files: Array<{ fieldname, originalname, mimetype, buffer, size, filename }>) {
      //local id and mapping server record
      let items: Array<Map<number, any>> = [];

      const attachments = <IAttachmentParams[]>request.body.attachments;
      if(!attachments || !attachments?.length) {
        return items;
      }
      //verify if file uploaded successfully
      // const successUploadedAttachs = attachments.filter(i => {
      //   const file = files.filter(f => {
      //     const guidFromName = f.filename.split('.')[0];
      //     if(guidFromName == i.guid) {
      //       return true;
      //     }
      //     return false;
      //   });
      //   return file || false;
      // });
 
      for (let model of attachments)
      {
        const itemMap: Map<number, IAttachmentParams> = new Map();
        let returnedItem: any;
  
        model.id = +model.id;
        if (model.markedForAdd) {
          //generate new one..ignore id from client
          let toAdd = Object.assign({}, model);
          delete toAdd.id;
  
          const item = await this.attachmentSvc.save(toAdd);
          returnedItem = item;        
        } else if(model.markedForUpdate) {
          const toUpdate = await this.attachmentSvc.findOne(model.id);
          if(!toUpdate) {
            continue;
          }
      
          let updated = await this._updateOrDelete(toUpdate, model, false);
          returnedItem = updated;
        } else if(model.markedForDelete) {
          const toDelete = await this.attachmentSvc.findOne(model.id);
          if(!toDelete) {
            continue;
          }
  
          let deleted = await this._updateOrDelete(toDelete, model, true);
          returnedItem = deleted;
        }

        returnedItem = await this._prepare(returnedItem);
  
        itemMap.set(model.id, returnedItem);
        items.push(itemMap);
      }

      return items;
    }

    private async _updateOrDelete(toUpdateOrDelete: Attachment, model, shouldDelete?: boolean) {
      //no need to update
      delete toUpdateOrDelete.createdOn;
      model.isDeleted = shouldDelete;
  
      let updated = Object.assign(toUpdateOrDelete, model);
      await this.attachmentSvc.save(updated);
  
      return updated;
    }

    private async _prepare(att: Attachment) {
      let mAtt = Object.assign({}, att);
      
      //remove 
      delete mAtt['markedForAdd'];
      delete mAtt['markedForUpdate'];
      delete mAtt['markedForDelete'];
  
      return mAtt;
    }
}

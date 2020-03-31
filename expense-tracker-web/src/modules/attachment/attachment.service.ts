import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment';

import { AppConstant } from '../shared/app-constant';
import { HelperService } from '../shared/helper.service';
import { Attachment } from './attachment.entity';
import { IAttachmentParams } from './attachment.model';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>
    , private helperSvc: HelperService
  ) {}

  findAll(): Promise<Attachment[]> {
    return this.attachmentRepo.find();
  }

  findOne(id): Promise<Attachment> {
    return this.attachmentRepo.findOne(id);
  }

  save(attachment: IAttachmentParams) {
    let newOrUpdated: any = Object.assign({}, attachment);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    // if(newOrUpdated.createdOn && !this.helperSvc.isValidDate(newOrUpdated.createdOn)) {
    //   newOrUpdated.createdOn = moment(attachment.createdOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    // }
    // if(newOrUpdated.updatedOn && !this.helperSvc.isValidDate(newOrUpdated.updatedOn)) {
    //   newOrUpdated.updatedOn = moment(attachment.updatedOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    // }

    return this.attachmentRepo.save<Attachment>(newOrUpdated);
  }

  remove(id) {
    return this.attachmentRepo.delete(id);
  }

  count() {
    return this.attachmentRepo.count();
  }
}
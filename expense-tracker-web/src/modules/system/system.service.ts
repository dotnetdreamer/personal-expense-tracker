import { Injectable, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Repository, getRepository, SelectQueryBuilder, getManager } from 'typeorm';
import * as moment from 'moment';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

import { UserService } from '../user/user.service';
import { ICurrentUser } from '../shared/shared.model';
import { EmailAccount } from './email-account';
import { IEmailAccountParams } from './system.model';
import { QueuedMessage } from './queued-message.entity';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(EmailAccount) private emailAccountRepo: Repository<EmailAccount>
    , @InjectRepository(QueuedMessage) private queuedMessageRepo: Repository<QueuedMessage>
  ) {}


  //#region Email Account 

  async findAllEmailAccounts(): Promise<any[]> {
    let qb = await getRepository(EmailAccount)
      .createQueryBuilder('ec')

    qb = qb.orderBy("ec.createdOn", 'DESC')
      .addOrderBy('ec.id', 'DESC');

    const data = await qb.getMany();

    //map 
    const result = data.map(ec => this._prepareEmailAccount(ec));
    return result;
  }

  findOneEmailAccount(id): Promise<EmailAccount> {
    return this.emailAccountRepo.findOne(id);
  }

  saveEmailAccount(emailAccount: IEmailAccountParams) {
    let newOrUpdated: any = Object.assign({}, emailAccount);

    // if(newOrUpdated.createdOn && !this.helperSvc.isValidDate(newOrUpdated.createdOn)) {
    //   newOrUpdated.createdOn = moment(category.createdOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    // }
    // if(newOrUpdated.updatedOn && !this.helperSvc.isValidDate(newOrUpdated.updatedOn)) {
    //   newOrUpdated.updatedOn = moment(category.updatedOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    // }

    return this.emailAccountRepo.save<EmailAccount>(newOrUpdated);
  }

  removeEmailAccount(id) {
    return this.emailAccountRepo.delete(id);
  }

  //#endregion


  //#region Messages

  async findAllQueuedMessages(): Promise<any[]> {
    let qb = await getRepository(QueuedMessage)
      .createQueryBuilder('qm')

    qb = qb.orderBy("qm.createdOn", 'DESC')
      .addOrderBy('qm.id', 'DESC');

    const data = await qb.getMany();

    //map 
    const result = data.map(qm => this._prepareQueuedMessage(qm));
    return result;
  }

  //#endregion

  //#region  Utillities

  private _prepareEmailAccount(ec: EmailAccount) {
    const { ...result } = ec;
    return result;
  }
  
  private _prepareQueuedMessage(qm: QueuedMessage) {
    const { ...result } = qm;
    return result;
  }

  //#endregion
}
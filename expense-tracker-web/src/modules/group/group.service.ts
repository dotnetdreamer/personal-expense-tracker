import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { Group } from './group.entity';
import { IGroupParams } from './group.model';
import { HelperService } from '../shared/helper.service';
import { IAttachmentParams } from '../attachment/attachment.model';
import { ICategoryParams } from '../category/category.model';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepo: Repository<Group>
  ) {}


  async findAll(args?: { name?: string, entityName?: string, fromDate?: string, toDate?: string, showHidden?: boolean }): Promise<Group[]> {
    let qb = await getRepository(Group)
      .createQueryBuilder('grp'); 
      
    if(args && (args.name || args.entityName || args.fromDate || args.toDate)) {
      if(args.name) {
        const name = args.name.trim().toLowerCase();
        qb = qb.andWhere('(grp.description like :name)', { name: `%${name}%` });
      }

      if(args.entityName) {
        const entityName = args.entityName.trim().toLowerCase();
        qb = qb.andWhere('grp.entityName == :entityName', { entityName: entityName });
      }

      if(args.fromDate) {
        // const fromDate =  moment(args.fromDate, AppConstant.DEFAULT_DATE_FORMAT).toDate();
        const fromDate = args.fromDate;
        qb = qb.andWhere('grp.createdOn >= :createdOnFrom', { createdOnFrom: fromDate });
      }

      if(args.toDate) {
        const toDate =  args.toDate; 
        qb = qb.andWhere('grp.createdOn <= :createdOnToDate', { createdOnToDate: toDate });
      }
      // console.log(qb.getQuery())
    }
      
    // .orWhere('user.email = :email', { email });
    qb = qb.andWhere('grp.isDeleted <= :isDeleted', { isDeleted: args && args.showHidden ? true : false });
    qb = qb.orderBy("grp.createdOn", 'DESC')
      .addOrderBy('grp.id', 'DESC');

    return qb.getMany();
  }

  findOne(id): Promise<Group> {
    return this.groupRepo.findOne(id);
  }

  save(group: IGroupParams) {
    let newOrUpdated: any = Object.assign({}, group);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    //now save
    return this.groupRepo.save<Group>(newOrUpdated);
  }

  remove(id) {
    return this.groupRepo.delete(id);
  }
}
import { Injectable, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';
import { Request } from 'express';

import { Group } from './group.entity';
import { IGroupParams, IGroupMemberParams } from './group.model';
import { GroupMember } from './group-member.entity';
import { UserService } from '../user/user.service';
import { REQUEST } from '@nestjs/core';
import { ICurrentUser } from '../shared/shared.model';
import { AppConstant } from '../shared/app-constant';
import { User } from '../user/user.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private groupRepo: Repository<Group>
    , @InjectRepository(GroupMember) private memberRepo: Repository<GroupMember>
    , @InjectRepository(User) private userRepo: Repository<User>
    , @Inject(REQUEST) private readonly request: Request
    , private userSvc: UserService
  ) {}


  async findAll(args?: { 
      name?: string, entityName?: string, userIds?: number[], 
      fromDate?: string, toDate?: string, showHidden?: boolean 
    }): Promise<Group[]> {
    let qb = await getRepository(Group)
      .createQueryBuilder('grp');
      // .leftJoinAndSelect("grp.members", "groupmember");
      
    if(args && (args.name || args.entityName || args.userIds || args.fromDate || args.toDate)) {
      if(args.name) {
        const name = args.name.trim().toLowerCase();
        qb = qb.andWhere('(grp.description like :name)', { name: `%${name}%` });
      }

      if(args.entityName) {
        const entityName = args.entityName.trim().toLowerCase();
        qb = qb.andWhere('grp.entityName = :entityName', { entityName: entityName });
      }

      if(args.userIds && args.userIds.length) {
        qb = qb.andWhere("grp.createdBy IN (:...userIds)", { userIds: args.userIds })
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


  findMemberByEmail(email) {
    // return this.memberRepo.find({ userId: })
  }

  async addMember(gm: IGroupMemberParams) {
    let result = {
      groupNotFound: false,
      memberNotFound: false,
      notAnOwner: false,
      data: null
    };

    const group = await this.findOne(gm.groupId);
    if(!group) {
      result.groupNotFound = true;
      return result;
    }

    //only owner can add members
    const currentUser = <ICurrentUser>this.request.user;
    if(currentUser.userId != group.createdBy) {
      result.notAnOwner = true;
      return result;
    }

    const user = await this.userRepo.findOne({ email: gm.email });
    if(!user) {
      result.memberNotFound = true;
      return result;
    }

    //already exist?


    let newOrUpdated: GroupMember = {
      user: user,
      group: group,
      id: undefined
    };

    if(!newOrUpdated.createdOn) {
      newOrUpdated.createdOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
    }

    //now save
    const member = await this.memberRepo.save<GroupMember>(newOrUpdated);
    result.data = member;

    return result;
  }
}
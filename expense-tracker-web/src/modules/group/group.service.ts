import { Injectable, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';
import { Request } from 'express';

import { Group } from './group.entity';
import { IGroupParams, IGroupMemberParams, GroupMemberStatus } from './group.model';
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
      name?: string, entityName?: string
      , fromDate?: string, toDate?: string, showHidden?: boolean 
    }): Promise<any[]> {
    let qb = await getRepository(Group)
      .createQueryBuilder('grp')
      .leftJoinAndSelect("grp.members", "grpMbr")
      .leftJoinAndSelect("grpMbr.user", "usr");
      
    if(args && (args.name || args.entityName || args.fromDate || args.toDate)) {
      if(args.name) {
        const name = args.name.trim().toLowerCase();
        qb = qb.andWhere('(grp.description like :name)', { name: `%${name}%` });
      }

      if(args.entityName) {
        const entityName = args.entityName.trim().toLowerCase();
        qb = qb.andWhere('grp.entityName = :entityName', { entityName: entityName });
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

    const user = <ICurrentUser>this.request.user;
    // qb = qb.andWhere("grp.createdBy IN (:...userIds)", { userIds: args.userIds });
    qb = qb.andWhere("(grp.createdBy = :currentUserId", { currentUserId: user.userId })
      .orWhere("(usr.id = :currentUserId", { currentUserId: user.userId })
      .andWhere("grpMbr.status IN (:...memberStatuses)))", { 
        memberStatuses: [GroupMemberStatus.Aproved, GroupMemberStatus.Pending]
      });

    qb = qb.andWhere('grp.isDeleted <= :isDeleted', { isDeleted: args && args.showHidden ? true : false });
    qb = qb.orderBy("grp.createdOn", 'DESC')
      .addOrderBy('grp.id', 'DESC');

    const data = await qb.getMany();

    //map 
    let result = data.map(g => this.prepareGroup(g));
    return result;
  }

  findOne(id): Promise<Group> {
    return this.groupRepo.findOne({ where: { id: id }, relations: ['members', 'members.user']});
  }

  async save(group: IGroupParams) {
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

  /* 
    Member
  */

  findMemberByEmail(email) {
    // return this.memberRepo.find({ userId: })
  }

  async findAllMemberByGroupId(args: { groupId }) {
    let qb = await getRepository(GroupMember)
      .createQueryBuilder('gmbr')      
      .leftJoinAndSelect("gmbr.group", "grp")
      .leftJoinAndSelect("gmbr.user", "usr");

    qb = qb.andWhere('grp.id = :groupId', { groupId: args.groupId });
    const members = await qb.getMany();
    //map 
    let result = members.map(m => this._prepareMember(m));
    return result;
  }

  async addOrUpdateMember(gm: IGroupMemberParams) {
    let result = {
      groupNotFound: false,
      memberNotFound: false,
      notAnOwner: false,
      alreadyMember: false,
      data: null
    };

    const group = await this.findOne(gm.groupId);
    if(!group) {
      result.groupNotFound = true;
      return result;
    }

    const user = await this.userRepo.findOne({ email: gm.email });
    if(!user) {
      result.memberNotFound = true;
      return result;
    }

    //TODO: owner can't add himself..

    //already exist?. fetch relation also to be used in _prepare method
    let toAddOrUpdate: GroupMember = await this.memberRepo.findOne(
      { user: user, group: group }, { relations: ["user", "group"] }
    );
    if(toAddOrUpdate) {
      toAddOrUpdate.status = gm.status || toAddOrUpdate.status;
      toAddOrUpdate.updatedOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
    } else {
      //only owner can add members
      const currentUser = <ICurrentUser>this.request.user;
      if(currentUser.userId != group.createdBy) {
        result.notAnOwner = true;
        return result;
      }

      toAddOrUpdate = {
        user: user,
        group: group,
        id: undefined,
        status: gm.status || GroupMemberStatus.Pending
      };
    }

    if(!toAddOrUpdate.createdOn) {
      toAddOrUpdate.createdOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
    }

    //now save
    const member = await this.memberRepo.save<GroupMember>(toAddOrUpdate);
    result.data = this._prepareMember(member);

    return result;
  }

  prepareGroup(group: Group): any {
    return {
      createdBy: group.createdBy,
      createdOn: group.createdOn,
      entityName: group.entityName,
      guid: group.guid,
      id: group.id,
      name: group.name,
      members: group.members.map(m => {
        return { 
          status: m.status,
          user: {
            name: m.user.name,
            email: m.user.email,
            photo: m.user.photo
          }
        };
      })
    };
  }
  
  private _prepareMember(member: GroupMember) {
    return {
      id: member.id,
      status: member.status,
      user: {
        name: member.user.name,
        email: member.user.email,
        photo: member.user.photo
      },
      group: {
        id: member.group.id,
        name: member.group.name,
        guid: member.group.guid,
        entityName: member.group.entityName
      }
    };
  }
}
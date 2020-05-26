import { Injectable, Inject } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder, getManager } from 'typeorm';
import * as moment from 'moment';
import { Request } from 'express';

import { Group } from './group.entity';
import { IGroupParams, IGroupMemberParams, GroupMemberStatus, GroupPeriodStatus } from './group.model';
import { GroupMember } from './group-member.entity';
import { UserService } from '../user/user.service';
import { REQUEST } from '@nestjs/core';
import { ICurrentUser } from '../shared/shared.model';
import { AppConstant } from '../shared/app-constant';
import { User } from '../user/user.entity';
import { GroupPeriod } from './group-period.entity';

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
      .leftJoinAndSelect("grp.periods", "pr")
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
    const cUserGroups = await getRepository(Group)
      .createQueryBuilder('grp')
      .leftJoinAndSelect("grp.members", "grpMbr")
      .where('grpMbr.userId = :gCurrentUserId', { gCurrentUserId: user.userId })
      .getMany();
    const cUserGroupIds = cUserGroups.map(g => +g.id);

    qb = qb.andWhere('grp.id IN (:...groupIds)', { groupIds: cUserGroupIds })
      .andWhere("grpMbr.status IN (:...memberStatuses)", { 
        memberStatuses: [GroupMemberStatus.Approved, GroupMemberStatus.Pending]
      });

    qb = qb.andWhere('grp.isDeleted = :isDeleted', { isDeleted: args && args.showHidden ? true : false });
    qb = qb.orderBy("grp.createdOn", 'DESC')
      .addOrderBy('grp.id', 'DESC');

    const data = await qb.getMany();

    //map 
    let result = data.map(g => this.prepareGroup(g));
    return result;
  }

  findOne(id): Promise<Group> {
    return this.groupRepo.findOne({ 
      where: { id: id }, 
      relations: ['members', 'members.user', 'periods']
    });
  }

  async save(group: IGroupParams) {
    // const group = new Group();
    let newOrUpdated: any = Object.assign({}, group);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    if(typeof newOrUpdated.periods === 'undefined') {
      //created default
      newOrUpdated.periods = [];
      const newPeriod: GroupPeriod = {
        id: undefined,
        startDate: <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT),
        endDate: undefined,
        status: GroupPeriodStatus.Open,
        group: undefined,
        createdOn: <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT)
      };
      newOrUpdated.periods.push(newPeriod);
    }

    //now save
    return this.groupRepo.save<Group>(newOrUpdated);
  }

  async settleUp(groupId) {
    let toUpdate = await this.findOne(groupId);
    if(!toUpdate) {
      return null;
    }

    const lastPeriod = toUpdate.periods[toUpdate.periods.length - 1];
    lastPeriod.endDate = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
    lastPeriod.updatedOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
    lastPeriod.status = GroupPeriodStatus.Closed;

    //create new 
    const newPeriod: GroupPeriod = {
      id: undefined,
      startDate: <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT),
      endDate: undefined,
      status: GroupPeriodStatus.Open,
      group: undefined,
      createdOn: <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT)
    };
    toUpdate.periods.push(newPeriod);

    //save
    await this.groupRepo.save(toUpdate);

    //prepare
    return this.prepareGroup(toUpdate);
  }

  remove(id) {
    return this.groupRepo.delete(id);
  }

  /* 
    Member
  */

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

    //already exist?. fetch relation also to be used in _prepare method
    let toAddOrUpdate: GroupMember = await this.memberRepo.findOne(
      { user: user, group: group }, { relations: ["user", "group"] }
    );

    if(toAddOrUpdate) {
      if(gm.id) {
        //update
        toAddOrUpdate.status = gm.status || toAddOrUpdate.status;
        toAddOrUpdate.updatedOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
      } else {
        //make sure member is added only once
        result.alreadyMember = true;
        return result;
      }
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
          id: m.id,
          status: m.status,
          user: {
            name: m.user.name,
            email: m.user.email,
            photo: m.user.photo
          }
        };
      }),
      periods: group.periods.map(p => {
        return p;
      }).sort((a, b) => {
        return moment(b.startDate).diff(a.startDate);
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
        photo: member.user.photo,
        owner: member.user.id == member.group.createdBy
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
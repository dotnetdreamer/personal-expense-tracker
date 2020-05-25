import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";

import { GroupService } from "./group.service";
import { IGroupParams, IGroupMemberParams, GroupMemberStatus } from "./group.model";
import { Group } from "./group.entity";
import { JwtAuthGuard } from "../user/auth/jwt-auth.guard";
import { ICurrentUser } from "../shared/shared.model";

@Controller('group')
export class GroupController {
  constructor(private readonly groupSvc: GroupService) {}

  //#region Group

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { name?: string, entityName?: string, fromDate?: string, toDate?: string }) {
    return this.groupSvc.findAll({
      ...filters
    });
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Req() req: Request, @Body() models: IGroupParams[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];
    const user = <ICurrentUser>req.user;

    for(let model of models) {
      const itemMap: Map<number, IGroupParams> = new Map();
      let returnedGroup: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        toAdd.createdBy = user.userId;
        delete toAdd.id;

        const item = await this.groupSvc.save(toAdd);

        //add current user as a member as well
        await this.groupSvc.addOrUpdateMember({
          email: user.username,
          groupId: (<any>item).id,
          status: GroupMemberStatus.Approved
        });

        //get the group with related data i.e members
        let newGrp = await this.groupSvc.findOne((<any>item).id);
        newGrp = this.groupSvc.prepareGroup(newGrp);

        returnedGroup = newGrp;        
      } else if(model.markedForUpdate) {
        const toUpdate = await this.groupSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
        toUpdate.updatedBy = user.userId;

        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedGroup = updated;
      } else if(model.markedForDelete) {
        const toDelete = await this.groupSvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }
        toDelete.updatedBy = user.userId;

        let deleted = await this._updateOrDelete(toDelete, model, true);
        returnedGroup = deleted;
      }

      returnedGroup = await this._prepare(returnedGroup);

      itemMap.set(model.id, returnedGroup);
      items.push(itemMap);
    }

    return items;
  }

  
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('settleUp')
  async settleUp(@Req() req: Request, @Body() args: { groupId }) {
    return this.groupSvc.settleUp(args.groupId);
  }

  //#endregion
  

  //#region Member 

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('addOrUpdateMember')
  async addOrUpdateMember(@Req() req: Request, @Body() model: IGroupMemberParams) {
    const member = await this.groupSvc.addOrUpdateMember(model);
    return member;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAllMemberByGroupId')
  async getAllMemberByGroupId(@Req() req: Request, @Query() filter: { groupId }) {
    const members = await this.groupSvc.findAllMemberByGroupId(filter);
    return members;
  }

  //#endregion

  //#region Utilities

  private async _updateOrDelete(toUpdateOrDelete: Group, model, shouldDelete?: boolean) {
    //no need to update
    // delete model.createdOn;
    // delete model.attachment;
    model.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.groupSvc.save(updated);

    return updated;
  }

  private async _prepare(grp: Group) {
    let mExp = Object.assign({}, grp);

    //remove 
    delete mExp['markedForAdd'];
    delete mExp['markedForUpdate'];
    delete mExp['markedForDelete'];

    return mExp;
  }

  //#endregion
}
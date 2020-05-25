import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

import { GroupService } from '../group.service';
import { BasePage } from '../../shared/base.page';
import { ModalController } from '@ionic/angular';
import { AppConstant } from '../../shared/app-constant';
import { IGroupMember, GroupMemberStatus } from '../group.model';
import { IUserProfile } from '../../authentication/user.model';

@Component({
  selector: 'group-member-modal',
  templateUrl: './group-member.modal.html',
  styleUrls: ['./group-member.modal.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GroupMemberModal extends BasePage implements OnInit {
  @Input() groupId: number;

  email: string;
  members: IGroupMember[] = [];
  currentUser: IUserProfile;
  displayAddToolbar = false;
  GroupMemberStatus = GroupMemberStatus;

  constructor(private modalCtrl: ModalController
    , private groupSvc: GroupService) { 
    super();
  }

  async ngOnInit() {
    await this._getAllMemberByGroupId();
    this.currentUser = await this.userSettingSvc.getUserProfileLocal();
  }


  async onMemberSaveClicked() {
    if(!this.email) {
      return;
    }

    const em = this.email.trim();
    const gId = +this.groupId;

    const result = await this.groupSvc.addOrUpdateMember({
      email: this.email,
      groupId: gId
    });
    if(AppConstant.DEBUG) {
      console.log('GroupMemberModal: onMemberSaveClicked', result);
    }

    if(result.data) {
      await this._refresh();
    }
  }

  async onMemberUpdateClicked(member: IGroupMember, opt: 'delete' | 'resend') {
    //TODO: need to review this logic
    if(opt == 'delete') {
      // const confirm = await this.helperSvc.presentConfirmDialog();
      // if(!confirm) {
      //   return;
      // }


    } else if(opt == 'resend') {
      const result = await this.groupSvc.addOrUpdateMember({
        id: member.id,
        email: member.user.email,
        groupId: member.group.id,
        status: GroupMemberStatus.Pending
      });
      if(AppConstant.DEBUG) {
        console.log('GroupMemberModal: onMemberUpdateClicked', result);
      }
  
      if(result.data) {
        await this._refresh();
      }
    }
  }

  async dismiss(data?) {
    await this.modalCtrl.dismiss(data);
  }

  toggleAddMemberClicked() {
    this.displayAddToolbar = !this.displayAddToolbar;
    this.email = null;
  }

  private async _refresh() {
    this.email = null;
    await this._getAllMemberByGroupId();
  }

  private async _getAllMemberByGroupId() {
    this.members = await this.groupSvc.getAllMemberByGroupId({
      groupId: this.groupId
    });
    if(AppConstant.DEBUG) {
      console.log('GroupMemberModal: _getAllMemberByGroupId: members', this.members);
    }
  }

}

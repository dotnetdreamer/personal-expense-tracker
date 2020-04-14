import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

import { GroupService } from '../group.service';
import { BasePage } from '../../shared/base.page';
import { ModalController } from '@ionic/angular';
import { AppConstant } from '../../shared/app-constant';
import { IGroupMember } from '../group.model';

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

  constructor(private modalCtrl: ModalController
    , private groupSvc: GroupService) { 
    super();
  }

  async ngOnInit() {
    await this._getAllMemberByGroupId();
  }


  async onMemberSaveClicked() {
    if(!this.email) {
      return;
    }

    const em = this.email.trim();
    const gId = +this.groupId;

    const result = await this.groupSvc.addOrUpdateMember(this.email, gId);
    if(AppConstant.DEBUG) {
      console.log('GroupMemberModal: onMemberSaveClicked', result);
    }
    if(result.data) {
      this.email = null;
      await this._getAllMemberByGroupId();
    }
  }

  async dismiss(data?) {
    await this.modalCtrl.dismiss(data);
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

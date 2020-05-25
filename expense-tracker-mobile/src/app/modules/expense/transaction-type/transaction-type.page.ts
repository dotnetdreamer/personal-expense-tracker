import { Component, OnInit, ViewEncapsulation, Input, ViewChild } from '@angular/core';
import { ModalController, IonContent } from '@ionic/angular';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';

import { TransactionType } from '../expense.model';
import { IGroupMember } from '../../group/group.model';
import { HelperService } from '../../shared/helper.service';
import { LocalizationService } from '../../shared/localization.service';
import { IUserProfile } from '../../authentication/user.model';
import { UserSettingService } from '../../authentication/user-setting.service';

@Component({
  selector: 'modal-expense-transaction-type',
  templateUrl: './transaction-type.page.html',
  styleUrls: ['./transaction-type.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TransactionTypeModal implements OnInit {
  @ViewChild('tpContent') tpContent: IonContent;
  @Input() transactionType: { type: TransactionType, membersWithAmount?: Array<{email,amount}> };
  @Input() allMembers: IGroupMember[];
  @Input() currentExpenseAmount: number;
  
  currentUser: IUserProfile;
  TransactionType = TransactionType;
  selectedType;
  memberFormGroup;
  //used in UI. We remove the added members from this array
  remainingMembers: IGroupMember[] = [];
  
  constructor(private modalCtrl: ModalController
    , private formBuilder: FormBuilder
    , private helperSvc: HelperService, private localizationSvc: LocalizationService
    , private userSettingSvc: UserSettingService) { 
      this.memberFormGroup = this.formBuilder.group({
        members: this.formBuilder.array([])
      });
  }

  async ngOnInit() { 
    this.currentUser = await this.userSettingSvc.getUserProfileLocal();

    if(this.transactionType) {
      this.selectedType = +this.transactionType.type;
    }

    if(!this.allMembers) {
      this.allMembers = [];
    }

    this.remainingMembers = this.allMembers;
    
    if(this.transactionType.membersWithAmount) {
      for(let member of this.transactionType.membersWithAmount) {
        this.members.push(this.formBuilder.group({ 
          email: [{ value: member.email, disabled: false }, Validators.compose([Validators.required, Validators.email])],
          amount: [{ value: member.amount, disabled: false }, Validators.compose([Validators.required])]
        })); 
      }
    } else {
      //add empty
      this.members.push(this.formBuilder.group({ 
        email: [{ value: '', disabled: false }, Validators.compose([Validators.required, Validators.email])],
        amount: [{ value: '', disabled: false }, Validators.compose([Validators.required])]
      })); 
    }
  }

  get members() : FormArray {
    return this.memberFormGroup.get("members") as FormArray;
  }

  async onTypeClicked(type: TransactionType) {
    if(type === TransactionType.PaidByOtherPersonAndSplitEqually
      || type == TransactionType.Mutiple) {
      //add empty...
      this.addMember();
      return;
    }

    this.selectedType = type;
    await this.dismiss(this.selectedType);
  }


  removeMember(i: number) {
    const lastMemberEmail = this.members.controls[i].value.email;
    this.members.removeAt(i);

    //add back the member to reamaining
    const toAdd = this.allMembers.find(m => m.user.email == lastMemberEmail);
    this.remainingMembers.push(toAdd);
  }

  addMember() {
    const last = this.members.controls[this.members.controls.length - 1] as FormGroup;
    if(last.value.email && last.value.amount) {
      this.members.push(this.formBuilder.group({ 
        email: ['', Validators.compose([Validators.required, Validators.email])],
        amount: ['', Validators.compose([Validators.required])] 
      }));

      //remove the last member from reamaining
      const iToRemove = this.remainingMembers.findIndex(m => m.user.email == last.value.email);
      this.remainingMembers.splice(iToRemove, 1);
    }

    setTimeout(async () => {
      await this.tpContent.scrollToBottom();
    });
  }

  async onMembersSubmit() {
    if (this.memberFormGroup.invalid) {
      return;
    }

    //expense amount and current distribution amount must be same...
    const amount = this.currentExpenseAmount;
    const members = (<Array<{ email, amount }>>this.members.value);

    //get the sum of entered amount
    const sum = members.reduce((a, b) => a + (+b.amount), 0);
    if(sum != amount) {
      const msg = await this.localizationSvc.getResource('expense.amount_sum_must_same');
      await this.helperSvc.presentInfoDialog(msg);
      return;
    }

    await this.dismiss(this.selectedType, members)
  }

  async dismiss(type?, membersWithAmount?: Array<{ email, amount }>) {
    //set default if pressed closed.
    if(!type) {
      type = this.transactionType.type;
    }

    if(!membersWithAmount) {
      membersWithAmount = this.transactionType.membersWithAmount
    }

    await this.modalCtrl.dismiss({
      type: type,
      membersWithAmount: membersWithAmount
    });
  }
}

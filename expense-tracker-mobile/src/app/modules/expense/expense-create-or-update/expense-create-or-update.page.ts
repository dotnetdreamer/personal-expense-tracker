import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { AlertController, ModalController, IonInput } from '@ionic/angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { AppConstant } from '../../shared/app-constant';
import { IExpense, TransactionType, IExpenseTransaction } from '../expense.model';
import { ICategory } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';
import { CategoryPage } from '../../category/category.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { IAttachment } from '../../attachment/attachment.model';
import { MlService } from '../../shared/ml/ml.service';
import { AttachmentService } from '../../attachment/attachment.service';
import { Subscription } from 'rxjs';
import { IGroup, GroupMemberStatus } from '../../group/group.model';
import { GroupService } from '../../group/group.service';
import { TransactionTypeModal } from '../transaction-type/transaction-type.page';
import { IUser, IUserProfile } from '../../authentication/user.model';

@Component({
  selector: 'page-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit, OnDestroy {
  @ViewChild('description') descriptionInput: IonInput;

  formGroup: FormGroup;
  categories: ICategory[];
  selectedCategory: ICategory;
  suggestedCategory: ICategory;
  todayDate;
  attachment: IAttachment;
  group: IGroup;
  selectedTransactionType: {type:TransactionType,membersWithAmount?:Array<{email,amount }>} = {
    type: TransactionType.PaidByYouAndSplitEqually,
  };
  currentUser: IUserProfile;

  private _expense: IExpense;
  private _routeParamsSub: Subscription;
  private _transactionTypeModal = null;

  constructor(private activatedRoute: ActivatedRoute
    , private formBuilder: FormBuilder, private location: Location
    , private alertCtrl: AlertController, private modalCtrl: ModalController
    , private expenseSvc: ExpenseService, private mlSvc: MlService
    , private categorySvc: CategoryService, private attachmentSvc: AttachmentService
    , private groupSvc: GroupService
    ) {
    super();

    const cDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.todayDate = cDate;

    this.formGroup = this.formBuilder.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      notes: [''],
      // attachment: [''],
      amount:['', Validators.required], 
      date: [this.todayDate, Validators.required]
    });
  }

  get f() { return this.formGroup.controls; }

  async ngOnInit() {
    this._routeParamsSub = this.activatedRoute.params.subscribe(async (params) => {
      let { id, groupId } = params;

      if(groupId) {
        groupId = +groupId;
        this.group = await this.groupSvc.getByIdLocal(groupId);
        if(AppConstant.DEBUG) {
          console.log('ExpenseCreateOrUpdatePage: ngOnInit: group', this.group);
        }
      }
      
      if(!id) {
        return;
      }

      id = +id;
      if(id <= 0) {
        return;
      }

      this._expense = await this.expenseSvc.getByIdLocal(id);
      if(AppConstant.DEBUG) {
        console.log('ExpenseCreateOrUpdatePage: ngOnInit: expense', this._expense);
      }

      this.f.categoryId.setValue(this._expense.category.id);
      this.selectedCategory = this._expense.category;
      
      this.f.description.setValue(this._expense.description);
      this.f.amount.setValue(this._expense.amount);
      this.f.notes.setValue(this._expense.notes);

      const cr = moment(this._expense.createdOn).local().format(AppConstant.DEFAULT_DATE_FORMAT);
      this.f.date.setValue(cr);
      this.todayDate = cr;

      if(this._expense.attachment) {
        this.attachment = this._expense.attachment;
      }
    });

    await this._getCategoryList();

    //auto focus on first field
    setTimeout(async () => {
      await this.descriptionInput.setFocus();
    }, 300);
    
    this.currentUser = await this.userSettingSvc.getUserProfileLocal();
  }

  async onSaveClick(args) {
    const exp: IExpense = {
      amount: args.amount,
      category: this.selectedCategory || this.suggestedCategory,
      description: args.description,
      notes: args.notes,
      createdOn: args.date
    };

    //TODO: add update logic here
    if(this._expense) {
      exp.id = this._expense.id;
      exp.markedForUpdate = true;

      //do not change the date if same, otherwise it will update the time of createdOn also
      const cr = moment(this._expense.createdOn).local().format(AppConstant.DEFAULT_DATE_FORMAT);
      if(cr == args.date) {
        exp.createdOn = moment(this._expense.createdOn).local()
        .format(AppConstant.DEFAULT_DATETIME_FORMAT);
      }
    }

    if(AppConstant.DEBUG) {
      console.log('ExpenseCreateOrUpdatePage: onSaveClick: exp', exp)
    }

    if(this.attachment) {
      const added = await this.attachmentSvc.putLocal(this.attachment);
      this.attachment.id = +added.insertId;
      exp.attachment = this.attachment;
    }

    //group
    if(this.group) {
      exp.group = this.group;
      exp.transactions = await this._distributeTransaction(exp, this.selectedTransactionType);;
    }

    await this.expenseSvc.putLocal(exp);
    await this.helperSvc.presentToastGenericSuccess();

    //fire after the page navigates away...
    setTimeout(() => {
      this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);
    }, 300);
    // if (window.history.length > 1) {
      await this.location.back();
    // } 
    // else {
      // await this.navigate({ path: '/expense/expense-listing', extras: { replaceUrl: true }});
    // }
  }

  onCreatedDateChanged(ev: CustomEvent) {
    const val = ev.detail.value;
    //format
    const fDate = moment(val).format(AppConstant.DEFAULT_DATE_FORMAT);
    this.f.date.setValue(fDate);
  }

  async onAttachmentChanged($event) {
    const file: File = $event.srcElement.files[0];
    if(file != undefined) {
      this.attachment = {
        filename: file.name,
        contentType: file.type,
        extension: file.name.split('.').pop(),
        attachment: file,
        guid: this.helperSvc.generateGuid(),
        markedForAdd: !this._expense || this._expense?.attachment == null,
        markedForUpdate: this._expense && this._expense.attachment != null
      };
      let reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = reader.result;
        this.attachment.attachment = arrayBuffer;
      };
      reader.readAsArrayBuffer(file);
    } else {
      this.attachment = null;
    }
    if(AppConstant.DEBUG) {
      console.log('onAttachmentChanged: attachment', this.attachment);
    }
  }

  async onAttachmentRemoveClicked() {
    const res = await this.helperSvc.presentConfirmDialog();
    if(!res) {
      return;
    }
    //if edit, and there was attachment but now not, then mark it delete
    if(this._expense && this._expense.attachment) {
      this.attachment.markedForDelete = true;
    } else {
      this.attachment = null;
    }    
  }

  // async onAttachmentClicked() {
  //   try {
  //     const result = await this.mediaDeviceHelper.presentMediaOptionsDialog({
  //       returnFileType: MediaReturnFileType.FILE_URI_OR_NATIVE_URI,
  //       mediaType: MediaFileType.Picture,
  //       validateFormatAndSize: false,
  //       displayRemoveLink: false,
  //       removeLinkCallback: async () => {
  //         const result = await this.helperSvc.presentConfirmDialog();
  //         if(!result) {
  //           return;
  //         }
  //       }
  //     });   

  //     if(AppConstant.DEBUG) {
  //       console.log('ExpenseCreateOrUpdatePage: onAttachmentClicked: result: ', result)
  //     }
  //   } catch (e) {
  //     if(e.permissionDenied) {
  //       let msg = await this.localizationSvc.getResource('common.permissiondenied');
  //       await this.helperSvc.presentToast(msg);
  //     }
  //   }
  // }

  async onNotesClicked() {
    const resources = await Promise.all([this.localizationSvc.getResource('expense.notes')
      , this.localizationSvc.getResource('common.cancel')
      , this.localizationSvc.getResource('common.ok')]);

    const alert = await this.alertCtrl.create({
      header: resources[0],
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          value: this.f.notes.value || '',
          placeholder: resources[0]
        }
      ],
      buttons: [
        {
          text: resources[1],
          role: 'cancel',
          // cssClass: 'secondary',
          // handler: () => {
          //   console.log('Confirm Cancel');
          // }
        }, {
          text: resources[2],
          // handler: () => {
          //   console.log('Confirm Ok');
          // }
        }
      ]
    });
    await alert.present();
    const { data } = await alert.onDidDismiss();
    if(data.values) {
      const noteVal = data.values.notes || '';
      this.f.notes.setValue(noteVal);
    } else {
      this.f.notes.setValue('');
    }
  }

  async onCategoryClicked(args) {
    const modal = await this.modalCtrl.create({
      component: CategoryPage,
      backdropDismiss: false,
      componentProps: {
        isOpenedAsModal: true
      }
    });
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if(data) {
      this.selectedCategory = data;
      this.f.categoryId.setValue(this.selectedCategory.id);
    } 
    // else {
    //   this.selectedCategory = null;
    //   this.f.categoryId.setValue('');
    // }
  }

  async onDescriptionChanged(ev) {
    //if user manually select category, do not predict
    if(this.selectedCategory) {
      return;
    }

    let description = this.f.description.value;
    if(description) {
      description = description.trim();
      if(description && !this.selectedCategory) {
        try {
          const category = await this.mlSvc.predictCategoryForExpenses(description);
          if(AppConstant.DEBUG) {
            console.log('onDescriptionChanged: acceptedPrediction', category);
          }
          
          if(category) {
            this.suggestedCategory = category;
            this.f.categoryId.setValue(this.suggestedCategory.id);
          }
        } catch(e) {
          //ignore...
        }
      }
    }
  }

  async onTransactionTypeClicked() {
    //avoid openning twice
    if(this._transactionTypeModal) {
      return;
    }
    
    //we sent copy to modal as we don't wanna modify orignal array
    const allMembers = [...this.group.members];
    
    this._transactionTypeModal = await this.modalCtrl.create({
      component: TransactionTypeModal,
      mode: 'md',
      cssClass: 'modal-transaction-type',
      backdropDismiss: false,
      componentProps: {
        transactionType: this.selectedTransactionType,
        allMembers: allMembers,
        currentExpenseAmount: this.f.amount.value
      }
    });
    await this._transactionTypeModal.present();

    const { data } = await this._transactionTypeModal.onDidDismiss();
    if(AppConstant.DEBUG) {
      console.log('ExpenseCreateOrUpdatePage: onTransactionTypeClicked: data:', data);
    }
    if(data) {
      this.selectedTransactionType = data;
    }
    this._transactionTypeModal = null;
  }

  ngOnDestroy() {
    if(this._routeParamsSub) {
      this._routeParamsSub.unsubscribe();
    }
  }

  private async _getCategoryList() {
    this.categories = await this.categorySvc.getCategoryListLocal();
  }

  private async _distributeTransaction(expense: IExpense
    , tranType: { type: TransactionType, membersWithAmount?: Array<any> }) {
    const total = +expense.amount;
    let members = this.group.members
      .filter(m => m.status == GroupMemberStatus.Approved);
    let membersWithoutCurrentUser = members.filter(m => m.user.email != this.currentUser.email);

    let transactions: IExpenseTransaction[] = [];
    let amountPerMbr = 0;

    switch(tranType.type) {
      //#region PaidByYouAndSplitEqually
      case TransactionType.PaidByYouAndSplitEqually:
        amountPerMbr = total / (members.length);

        for(let member of members) {
          const isCurrentMember = member.user.email == this.currentUser.email;
          transactions.push({
            transactionType: TransactionType.PaidByYouAndSplitEqually,
            credit: isCurrentMember ? total - amountPerMbr : 0,
            debit: amountPerMbr,
            email: member.user.email,
            actualPaidAmount: isCurrentMember ? total : 0
          });
        }
      break;
      //#endregion

      //#region YouOweFullAmount
      case TransactionType.YouOweFullAmount:
        //add total amount to debits for current member 
        //and divide rest amount on other members to credit
        amountPerMbr = total / (membersWithoutCurrentUser.length);

        //current member
        transactions.push({
          transactionType: TransactionType.YouOweFullAmount,
          credit: 0,
          debit: total,
          email: this.currentUser.email,
          actualPaidAmount: 0
        });
        //others
        for(let member of membersWithoutCurrentUser) {
          transactions.push({
            transactionType: TransactionType.YouOweFullAmount,
            credit: amountPerMbr,
            debit: 0,
            email: member.user.email,
            actualPaidAmount: amountPerMbr
          });
        }
      break;
      //#endregion
      
      //#region TheyOweFullAmount
      case TransactionType.TheyOweFullAmount:
        //divide total amount on group members and add their debits, 
        //and add total to current member credit 
        amountPerMbr = total / membersWithoutCurrentUser.length;

        //current member
        transactions.push({
          transactionType: TransactionType.TheyOweFullAmount,
          credit: total,
          debit: 0,
          email: this.currentUser.email,
          actualPaidAmount: total
        });
        //others
        for(let member of membersWithoutCurrentUser) {
          transactions.push({
            transactionType: TransactionType.TheyOweFullAmount,
            credit: 0,
            debit: amountPerMbr,
            email: member.user.email,
            actualPaidAmount: 0
          });
        }
      break;
      //#endregion
      
      //#region PaidByOtherPersonAndSplitEqually
      case TransactionType.PaidByOtherPersonAndSplitEqually:
        const ma = this.selectedTransactionType.membersWithAmount[0];
        amountPerMbr = total / members.length;

        for(let member of members) {
          const isOtherMember = member.user.email == ma.email;
          transactions.push({
            transactionType: TransactionType.PaidByOtherPersonAndSplitEqually,
            credit: isOtherMember ? total - amountPerMbr : 0,
            debit: amountPerMbr,
            email: member.user.email,
            actualPaidAmount: isOtherMember ? ma.amount : 0
          });
        }
      break;
      //#endregion

      //#region Mutiple
      case TransactionType.Mutiple:
        amountPerMbr = total / members.length;
        const membersWhoPaid = this.selectedTransactionType.membersWithAmount;

        for(let member of members) {
          const tran: IExpenseTransaction = {
            transactionType: TransactionType.Mutiple,
            email: member.user.email,
            debit: amountPerMbr,
            credit: 0,
            actualPaidAmount: 0
          };

          //get paid amount of the paid members
          const memberWhoPaid = membersWhoPaid.filter(mp => mp.email == member.user.email)[0];
          if(memberWhoPaid) {
            //member paid amount is 'greater or less than' the amount he is supposed to pay
            tran.credit = memberWhoPaid.amount - amountPerMbr;
            tran.actualPaidAmount = memberWhoPaid.amount;
          }
          transactions.push(tran);
        }
      break;
      //#endregion
    }

    return transactions;
  }

  private _preFill() {
    const rand = this.helperSvc.getRandomNumber();

    if(this.categories.length) {
      this.f.categoryId.setValue(this.categories[0].id);
    }
    this.f.description.setValue(`Testing description: ${rand}`);
    this.f.amount.setValue(rand);
  }

}

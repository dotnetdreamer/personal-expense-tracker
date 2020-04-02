import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';

import { AlertController, ModalController, IonInput } from '@ionic/angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { AppConstant } from '../../shared/app-constant';
import { IExpense } from '../expense.model';
import { ICategory } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';
import { CategoryPage } from '../../category/category.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { IAttachment } from '../../attachment/attachment.model';
import { MlService } from '../../shared/ml/ml.service';

@Component({
  selector: 'page-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {
  @ViewChild('description') descriptionInput: IonInput;

  formGroup: FormGroup;
  categories: ICategory[];
  selectedCategory: ICategory;
  suggestedCategory: ICategory;
  todayDate;

  private _attachment: IAttachment;

  constructor(private formBuilder: FormBuilder, private location: Location
    , private alertCtrl: AlertController, private modalCtrl: ModalController
    , private expenseSvc: ExpenseService, private mlSvc: MlService
    , private categorySvc: CategoryService
    ) {
    super();

    const cDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.todayDate = cDate;

    this.formGroup = this.formBuilder.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      notes: [''],
      attachment: [''],
      amount:['', Validators.required], 
      date: [this.todayDate, Validators.required]
    });
  }

  get f() { return this.formGroup.controls; }

  async ngOnInit() {
    await this._getCategoryList();

    //auto focus on first field
    setTimeout(async () => {
      await this.descriptionInput.setFocus();
    }, 300);
    // if(AppConstant.DEBUG) {
    //   this._preFill();
    // }
  }

  async onSaveClick(args) {
    const exp: IExpense = {
      amount: args.amount,
      category: this.selectedCategory || this.suggestedCategory,
      description: args.description,
      notes: args.notes,
      attachment: this._attachment,
      createdOn: args.date
    };
    //TODO: add update logic here
    // if(category) {
    //   cat.id = category.id;
    //   cat.markedForUpdate = true;
    // }
    if(AppConstant.DEBUG) {
      console.log('ExpenseCreateOrUpdatePage: onSaveClick: exp', exp)
    }

    await this.expenseSvc.putLocal(exp);
    this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);

    await this.helperSvc.presentToastGenericSuccess();

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
      this._attachment = {
        filename: file.name,
        contentType: file.type,
        extension: file.name.split('.').pop(),
        attachment: file,
        guid: this.helperSvc.generateGuid()
      };
      let reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = reader.result;
        this._attachment.attachment = arrayBuffer;
        // let blob = new Blob([e.target.result], { type: file.type });
        // this.f.attachment.setValue(e.target.result);
      };
      reader.readAsArrayBuffer(file);
      // reader.readAsBinaryString(file);
    } else {
      this._attachment = null;
    }
    if(AppConstant.DEBUG) {
      console.log('onAttachmentChanged: attachment', this._attachment);
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

  private async _getCategoryList() {
    this.categories = await this.categorySvc.getCategoryListLocal();
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

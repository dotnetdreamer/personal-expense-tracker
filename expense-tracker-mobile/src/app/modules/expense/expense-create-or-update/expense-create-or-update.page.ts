import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';

import { AlertController, ModalController } from '@ionic/angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { AppConstant } from '../../shared/app-constant';
import { MediaUploaderService } from '../../shared/media/media-uploader.service';
import { MediaDeviceHelper } from '../../shared/media/media-device-helper';
import { IExpense } from '../expense.model';
import { ICategory } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';
import { CategoryPage } from '../../category/category.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { IAttachment } from '../../attachment/attachment.model';

@Component({
  selector: 'page-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {
  formGroup: FormGroup;
  categories: ICategory[];
  selectedCategory: ICategory;

  private _attachment: IAttachment;

  constructor(private formBuilder: FormBuilder, private location: Location
    , private alertCtrl: AlertController
    , private expenseSvc: ExpenseService, private mediaUploaderSvc: MediaUploaderService
    , private mediaDeviceHelper: MediaDeviceHelper, private categorySvc: CategoryService
    , private modalCtrl: ModalController
    ) {
    super();

    const cDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.formGroup = this.formBuilder.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      notes: [''],
      attachment: [''],
      amount:['', Validators.required], 
      date: [cDate, Validators.required]
    });
  }

  get f() { return this.formGroup.controls; }

  async ngOnInit() {
    await this._getCategoryList();

    // if(AppConstant.DEBUG) {
    //   this._preFill();
    // }
  }

  async onSaveClick(args) {
    const exp: IExpense = {
      amount: args.amount,
      category: this.selectedCategory,
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

    this.eventPub.$pub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, exp);
    this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);

    const msg = await this.localizationSvc.getResource('common.success');
    await this.helperSvc.presentToast(msg);

    // if (window.history.length > 1) {
      await this.location.back();
    // } 
    // else {
    //   await this.navigate({ path: '/expense/expense-listing', extras: { replaceUrl: true }});
    // }
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
    } else {
      this.f.categoryId.setValue('');
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

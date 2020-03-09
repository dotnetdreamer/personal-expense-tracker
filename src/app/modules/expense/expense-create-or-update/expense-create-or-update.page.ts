import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

import { AlertController } from '@ionic/angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { AppConstant } from '../../shared/app-constant';
import { MediaUploaderService } from '../../shared/media/media-uploader.service';
import { MediaDeviceHelper } from '../../shared/media/media-device-helper';
import { MediaReturnFileType, MediaFileType } from '../../shared/media/media.model';
import { IExpense } from '../expense.model';
import { ICategory } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';

@Component({
  selector: 'page-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {
  formGroup: FormGroup;
  categories: ICategory[];

  constructor(private formBuilder: FormBuilder, private location: Location
    , private alertCtrl: AlertController
    , private expenseSvc: ExpenseService, private mediaUploaderSvc: MediaUploaderService
    , private mediaDeviceHelper: MediaDeviceHelper, private categorySvc: CategoryService
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

    if(AppConstant.DEBUG) {
      this._preFill();
    }
  }


  async onSaveClick(args) {
    const exp: IExpense = {
      amount: args.amount,
      categoryId: args.categoryId,
      description: args.description,
      notes: args.notes,
      attachment: args.attachment,
      createdOn: args.date
    };
    if(AppConstant.DEBUG) {
      console.log('ExpenseCreateOrUpdatePage: onSaveClick: exp',exp)
    }

    await this.expenseSvc.put(exp);
    this.eventPub.$pub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, exp);
    
    const msg = await this.localizationSvc.getResource('common.success');
    await this.helperSvc.presentToast(msg);

    // if (window.history.length > 1) {
      await this.location.back();
    // } 
    // else {
    //   await this.navigate({ path: '/expense/expense-listing', extras: { replaceUrl: true }});
    // }
  }

  async onAttachmentClicked() {
    try {
      const result = await this.mediaDeviceHelper.presentMediaOptionsDialog({
        returnFileType: MediaReturnFileType.FILE_URI_OR_NATIVE_URI,
        mediaType: MediaFileType.Picture,
        validateFormatAndSize: false,
        displayRemoveLink: false,
        removeLinkCallback: async () => {
          const result = await this.helperSvc.presentConfirmDialog();
          if(!result) {
            return;
          }
        }
      });   

      if(AppConstant.DEBUG) {
        console.log('ExpenseCreateOrUpdatePage: onAttachmentClicked: result: ', result)
      }
    } catch (e) {
      if(e.permissionDenied) {
        let msg = await this.localizationSvc.getResource('common.permissiondenied');
        await this.helperSvc.presentToast(msg);
      }
    }
  }

  async onAttachmentChanged($event) {
    const file = $event.srcElement.files[0];
    if(file != undefined){
      let reader = new FileReader();
      reader.onload = (e) => {
        // let blob = new Blob([e.target.result], { type: file.type });
        this.f.attachment.setValue(e.target.result);
      };
      reader.readAsArrayBuffer(file);
    } else {
      this.f.attachment.setValue(null);
    }
    if(AppConstant.DEBUG) {
      console.log('onAttachmentChanged: attachment', this.f.attachment.value);
    }
  }

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

  private async _getCategoryList() {
    this.categories = await this.categorySvc.getCategoryList();
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

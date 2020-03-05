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

@Component({
  selector: 'page-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {
  formGroup: FormGroup;

  private _attachments = [];
  constructor(private formBuilder: FormBuilder, private location: Location
    , private alertCtrl: AlertController
    , private expenseSvc: ExpenseService, private mediaUploaderSvc: MediaUploaderService
    , private mediaDeviceHelper: MediaDeviceHelper
    ) {
    super();

    const cDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.formGroup = this.formBuilder.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      notes: [''],
      amount:['', Validators.required],
      date: [cDate, Validators.required]
    });
  }

  get f() { return this.formGroup.controls; }

  ngOnInit() {
    if(AppConstant.DEBUG) {
      this._preFill();
    }
  }


  async onSaveClick(args) {
    const exp = {
      amount: args.amount,
      categoryId: args.categoryId,
      description: args.description,
      notes: args.notes,
      createdOn: args.date
    };
    await this.expenseSvc.put(exp);
    if(AppConstant.DEBUG) {
      console.log('ExpenseCreateOrUpdatePage: onSaveClick: exp',exp)
    }
    
    this.eventPub.$pub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, exp);
    
    const msg = await this.localizationSvc.getResource('common.success');
    await this.helperSvc.presentToast(msg);

    await this.location.back();
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

  async onAttachmentChanged($event) {
    if($event.srcElement.files[0] != undefined){
      this._attachments.push({
        file: $event.srcElement.files[0],
      });
    }
    if(AppConstant.DEBUG) {
      console.log('onAttachmentChanged: _attachments', this._attachments);
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

  private _preFill() {
    this.f.categoryId.setValue(1);
    this.f.description.setValue('Testing description');
    this.f.amount.setValue(20);
  }

}

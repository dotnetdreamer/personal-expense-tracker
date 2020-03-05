import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

import { BasePage } from '../../shared/base.page';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ExpenseService } from '../expense.service';

import { AppConstant } from '../../shared/app-constant';

import * as moment from 'moment';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'page-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {
  formGroup: FormGroup;

  constructor(private formBuilder: FormBuilder, private location: Location
    , private alertCtrl: AlertController
    , private expenseSvc: ExpenseService) {
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

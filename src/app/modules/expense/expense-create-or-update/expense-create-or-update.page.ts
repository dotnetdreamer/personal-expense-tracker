import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

import { BasePage } from '../../shared/base.page';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AppConstant } from '../../shared/app-constant';
import { ExpenseService } from '../expense.service';

import * as moment from 'moment';

@Component({
  selector: 'app-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {
  formGroup: FormGroup;

  constructor(private formBuilder: FormBuilder, private location: Location
    , private expenseSvc: ExpenseService) {
    super();

    const cDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.formGroup = this.formBuilder.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
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

  private _preFill() {
    this.f.categoryId.setValue(1);
    this.f.description.setValue('Testing description');
    this.f.amount.setValue(20);
  }

}

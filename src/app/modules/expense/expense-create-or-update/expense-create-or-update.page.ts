import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

import { BasePage } from '../../shared/base.page';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AppConstant } from '../../shared/app-constant';
import { ExpenseService } from '../expense.service';
import { HelperService } from '../../shared/helper.service';
import { LocalizationService } from '../../shared/localization.service';

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

    this.formGroup = this.formBuilder.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      amount:['', Validators.required]
    });
  }

  get f() { return this.formGroup.controls; }

  ngOnInit() {
    if(AppConstant.DEBUG) {
      this._preFill();
    }
  }


  async onSaveClick(args) {
    await this.expenseSvc.put({
      amount: args.amount,
      categoryId: args.categoryId,
      description: args.description,
    });
    
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

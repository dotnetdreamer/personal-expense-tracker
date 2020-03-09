import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BasePage } from '../../shared/base.page';
import { ActivatedRoute } from '@angular/router';
import { AppConstant } from '../../shared/app-constant';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';

@Component({
  selector: 'page-expense-detail',
  templateUrl: './expense-detail.page.html',
  styleUrls: ['./expense-detail.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseDetailPage extends BasePage implements OnInit {
  expense: IExpense;

  constructor(private activatedRoute: ActivatedRoute
    , private expenseSvc: ExpenseService) {
    super();
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      if(AppConstant.DEBUG) {
        console.log('ExpenseDetailPage: ngOnInit: params', params);
      }

      const { id } = params;
      await this._getExpese(+id);
    });
  }

  private async _getExpese(id) {
    this.expense = await this.expenseSvc.getById(id);
    if(AppConstant.DEBUG) {
      console.log('ExpenseDetailPage: ngOnInit: expense', this.expense);
    }
  }

}

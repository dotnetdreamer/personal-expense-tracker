import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';

@Component({
  selector: 'app-expense-listing',
  templateUrl: './expense-listing.page.html',
  styleUrls: ['./expense-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseListingPage extends BasePage implements OnInit {
  expenses: Array<IExpense> = [];

  constructor(private expenseSvc: ExpenseService) { 
    super();
  }

  async ngOnInit() {
    await this._getExpenses();
  }

 
  async onAddClick() {
    await this.navigate({ path: '/expense/expense-create-or-update'})
  }


  private async _getExpenses() {
    this.expenses = await this.expenseSvc.getExpenseList();
  }
}

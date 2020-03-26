import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';
import { AppConstant } from '../../shared/app-constant';

@Component({
  selector: 'page-expense-listing',
  templateUrl: './expense-listing.page.html',
  styleUrls: ['./expense-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseListingPage extends BasePage implements OnInit {
  expenses: Array<IExpense> = [];
  searchTerm: string;

  constructor(private expenseSvc: ExpenseService) { 
    super();

    this._subscribeToEvents();
  }

  async ngOnInit() {
    await this._getExpenses();
  }

  async onSearchInputChanged(args: CustomEvent) {
    if(!this.searchTerm || this.searchTerm?.length < 3) {
      await this._getExpenses();
      return;
    }

    await this._getExpenses(this.searchTerm);
  }

  async onSearchInputCleared(args: CustomEvent) {
    this.searchTerm = null;
    await this._getExpenses();
  }

 
  async onAddClick() {
    await this.navigate({ path: '/expense/expense-create-or-update'})
  }

  async onExpenseItemClicked(expense: IExpense) {
    await this.navigate({ path: '/expense/expense-detail', params: { id: expense.id }});
  }


  private async _getExpenses(term?) {
    let filters = null;
    if(term) {
      filters = {
        term: this.searchTerm
      }
    }

    this.expenses = await this.expenseSvc.getExpenseListLocal(filters);
    if(AppConstant.DEBUG) {
      console.log('ExpenseListingPage: _getExpenses: expenses', this.expenses);
    }
  }

  private _subscribeToEvents() {
    this.eventPub.$sub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, async (expense: IExpense) => {
      await this._getExpenses();
    });
  }
}

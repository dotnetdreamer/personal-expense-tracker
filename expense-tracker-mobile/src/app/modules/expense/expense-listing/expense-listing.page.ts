import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';
import { AppConstant } from '../../shared/app-constant';
import { CurrencySettingService } from '../../currency/currency-setting.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'page-expense-listing',
  templateUrl: './expense-listing.page.html',
  styleUrls: ['./expense-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseListingPage extends BasePage implements OnInit, OnDestroy {
  expenses: Array<IExpense> = [];
  searchTerm: string;
  sum = 0;
  workingCurrency = ''; //fix for undefined showing in title

  private _syncInitSub: Subscription;
  private _expenseCreatedOrUpdatedSub: Subscription;

  constructor(private expenseSvc: ExpenseService
    , private currencySettingSvc: CurrencySettingService) { 
    super();

    this._subscribeToEvents();
  }

  async ngOnInit() {
    //we call this on sync complete at the bottom
    // await this._getExpenses();
    this.workingCurrency = await this.currencySettingSvc.getWorkingCurrency();
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

  async onExpenseItemDeleteClicked(ev: CustomEvent, expense: IExpense) {
    ev.stopImmediatePropagation();

    const res = await this.helperSvc.presentConfirmDialog();
    if(res) {
      expense.markedForDelete = true;
      await this.expenseSvc.putLocal(expense);
      
      this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);
      await this.helperSvc.presentToastGenericSuccess();
    }
  }

  ngOnDestroy() {
    if(this._expenseCreatedOrUpdatedSub) {
      this._expenseCreatedOrUpdatedSub.unsubscribe();
    }

    if(this._syncInitSub) {
      this._syncInitSub.unsubscribe();
    }
  }

  private async _getExpenses(term?) {
    let filters = null;
    if(term) {
      filters = {
        term: this.searchTerm
      }
    }

    this.expenses = await this.expenseSvc.getExpenseListLocal(filters);
    this.sum = this.expenses.reduce((a, b) => a + (+b.amount), 0);
    if(AppConstant.DEBUG) {
      console.log('ExpenseListingPage: _getExpenses: expenses', this.expenses);
    }
  }

  private _subscribeToEvents() {
    this._expenseCreatedOrUpdatedSub = this.eventPub.$sub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, async (expense: IExpense) => {
      if(AppConstant.DEBUG) {
        console.log('ExpenseListingPage: EVENT_EXPENSE_CREATED_OR_UPDATED: expense', expense);
      }
      await this._getExpenses();
    });

    this._syncInitSub = this.eventPub.$sub(AppConstant.EVENT_SYNC_INIT_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('ExpenseListingPage:Event received: EVENT_SYNC_INIT_COMPLETE');
      }
      await this._getExpenses();
    });
  }
}

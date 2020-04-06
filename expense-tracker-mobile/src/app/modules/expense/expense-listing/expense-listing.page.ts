import { Component, OnInit, ViewEncapsulation, OnDestroy, NgZone } from '@angular/core';

import { Subscription, Observable } from 'rxjs';
import { debounce, debounceTime } from 'rxjs/operators';

import { AlertController, IonItemSliding } from '@ionic/angular';
import * as moment from 'moment';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';
import { AppConstant } from '../../shared/app-constant';
import { CurrencySettingService } from '../../currency/currency-setting.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';

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
  dates: { selectedDate?: { from, to }, todayDate? } = {};
  workingCurrency = ''; //fix for undefined showing in title

  private _syncInitSub: Subscription;
  private _expenseCreatedOrUpdatedSub: Subscription;
  private _syncDataPushCompleteSub: Subscription;

  constructor(private ngZone: NgZone, private alertCtrl: AlertController
    , private expenseSvc: ExpenseService
    , private currencySettingSvc: CurrencySettingService) { 
    super();

    this._subscribeToEvents();
  }

  async ngOnInit() {    
    this.workingCurrency = await this.currencySettingSvc.getWorkingCurrency();

    const fromDate = moment().startOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);
    const toDate = moment().endOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);

    this.dates.todayDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.dates.selectedDate =  {
      from: fromDate,
      to: toDate
    };

    //fix: navigation lag
    setTimeout(async () => {
      await this._getExpenses();
    }, 300);
  }

  async onMonthChanged(args: { start, end, month }) {
    if(!args) {
      return;
    }

    const loader = await this.helperSvc.loader;
    await loader.present();

    try {
      this.dates.selectedDate =  {
        from: args.start,
        to: args.end
      };
      await this._getExpenses({ term: this.searchTerm });
    } catch (e) {
      await this.helperSvc.presentToast(e, false);
    } finally {
      setTimeout(async () => {
        await loader.dismiss();
      }, 300);
    }
  }

  async onSearchInputChanged(args: CustomEvent) {
    if(!this.searchTerm || this.searchTerm?.length < 3) {
      // await this._getExpenses();
      return;
    }

    await this._getExpenses({ term: this.searchTerm });
  }

  async onSearchInputCleared(args: CustomEvent) {
    this.searchTerm = null;
    await this._getExpenses();
  }

  async onAddClicked() {
    await this.navigate({ path: '/expense/expense-create-or-update' });
  }

  async onExpenseItemClicked(ev: CustomEvent, expense: IExpense
    , action: 'detail' | 'edit' | 'delete', slidingItem: IonItemSliding) {
    ev.stopImmediatePropagation();
    await slidingItem.close();
    
    if(action == 'detail') {
      await this.navigate({ path: '/expense/expense-detail', params: { id: expense.id }});
    } else if(action === 'edit') {
      //wait till item is synced...
      // if(expense.markedForAdd || expense.markedForUpdate || expense.markedForDelete) {
      //   return;
      // }
      // await this._presentUpdateModal(expense);
      await this.navigate({ 
        path: '/expense/expense-create-or-update', 
        params: { 
          id: expense.id 
        } 
      });
    } else if(action === 'delete') {
      const res = await this.helperSvc.presentConfirmDialog();
      if(res) {
        expense.markedForDelete = true;
        expense.updatedOn = null;

        await this.expenseSvc.putLocal(expense);
        
        this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);
        await this.helperSvc.presentToastGenericSuccess();
      }
    }
  }

  async doRefresh(ev) {
    //reset
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);

    setTimeout(() => {
      ev.target.complete();
    }, 300);
  }

  ngOnDestroy() {
    if(this._expenseCreatedOrUpdatedSub) {
      this._expenseCreatedOrUpdatedSub.unsubscribe();
    }
    if(this._syncInitSub) {
      this._syncInitSub.unsubscribe();
    }
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
  }

  private async _getExpenses(args?: { term? }) {
    let filters:any = {
      fromDate: this.dates.selectedDate.from,
      toDate: this.dates.selectedDate.to
    };
 
    if(args && args.term) {
      filters.term = args.term;
    }

    this.ngZone.run(async () => {
      const currentMonth = moment().format('M');
      const fromDateMonth = moment(filters.fromDate).format('M');
      const toDateMonth = moment(filters.toDate).format('M');

      //if changed month is not same as current month, then we don't have entries local..
      if(currentMonth != fromDateMonth || currentMonth != toDateMonth) {
        this.expenses = await this.expenseSvc.getExpenses(filters);
      } else {
        this.expenses = await this.expenseSvc.getExpenseListLocal(filters);
      }

      this.sum = this.expenses.reduce((a, b) => a + (+b.amount), 0);
      if(AppConstant.DEBUG) {
        console.log('ExpenseListingPage: _getExpenses: expenses', this.expenses);
      }
    });
  }

  private _subscribeToEvents() {
    // this._expenseCreatedOrUpdatedSub = this.pubsubSvc.subscribe(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, async (expense: IExpense) => {
    //   if(AppConstant.DEBUG) {
    //     console.log('ExpenseListingPage: EVENT_EXPENSE_CREATED_OR_UPDATED: expense', expense);
    //   }
    //   await this._getExpenses();
    // });

    this.pubsubSvc.getEventObservable(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE)
      .pipe(debounceTime(500))
      .subscribe(() => {
        if(AppConstant.DEBUG) {
          console.log('ExpenseListingPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
        }
        //force refresh...
        this.expenses = [];
        setTimeout(async () => {
          await this._getExpenses();
        });
    });

    // this._syncDataPushCompleteSub = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, async () => {
    //   if(AppConstant.DEBUG) {
    //     console.log('ExpenseListingPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
    //   }
    //   //force refresh...
    //   this.expenses = [];
    //   setTimeout(async () => {
    //     await this._getExpenses();
    //   });
    // });

    //important to add here since the application loads and the view will show but there will be no data...
    //this is needed only when the application runs first time (i.e startup)
    // this._syncInitSub = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
    //   if(AppConstant.DEBUG) {
    //     console.log('ExpenseListingPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
    //   }
    //   await this._getExpenses();
    // });
  }

  private _debounce(func, wait, immediate?) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  private async _presentUpdateModal(expense: IExpense) {
    const resources = await Promise.all([
      this.localizationSvc.getResource('expense.title')
      , this.localizationSvc.getResource('expense.description')
      , this.localizationSvc.getResource('expense.amount')
      , this.localizationSvc.getResource('common.cancel')
    ]);

    const title = resources[0];
    const alert = await this.alertCtrl.create({
      header: title,
      inputs: [
        {
          name: 'description',
          type: 'text',
          value: expense.description,
          placeholder: resources[1]
        },
        {
          name: 'amount',
          type: 'number',
          value: expense.amount,
          placeholder: resources[2]
        }
      ],
      buttons: [
        {
          text: resources[3],
          role: 'cancel',
          cssClass: 'secondary',
          // handler: () => {
          // }
        }, {
          text: 'Ok',
          handler: async (data) => {
            if(!data.description && !data.amount) {
              return;
            }

            if(!data.description.trim().length) {
              return;
            }

            await this.expenseSvc.putLocal({
              ...expense,
              description: data.description,
              amount: data.amount,
              markedForUpdate: true,
              updatedOn: null
            });   

            this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);
            // this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);
          }
        }
      ]
    });

    await alert.present();
  }
}

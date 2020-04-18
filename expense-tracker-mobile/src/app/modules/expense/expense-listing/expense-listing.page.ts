import { Component, OnInit, ViewEncapsulation, OnDestroy, NgZone, ViewChild } from '@angular/core';

import { Subscription, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { AlertController, IonItemSliding, IonContent, PopoverController } from '@ionic/angular';
import * as moment from 'moment';

import { BasePage } from '../../shared/base.page';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';
import { AppConstant } from '../../shared/app-constant';
import { CurrencySettingService } from '../../currency/currency-setting.service';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { ActivatedRoute } from '@angular/router';
import { IGroup } from '../../group/group.model';
import { GroupService } from '../../group/group.service';
import { ExpenseListingOption } from './expense-listing-options.popover';

@Component({
  selector: 'page-expense-listing',
  templateUrl: './expense-listing.page.html',
  styleUrls: ['./expense-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseListingPage extends BasePage implements OnInit, OnDestroy {
  @ViewChild('epListingContent') epListingContent: IonContent;

  displayHeaderbar = true;
  expenses: Array<IExpense> = [];
  searchTerm: string;
  displaySearch = false;
  sum = 0;
  dates: { selectedDate?: { from, to }, todayDate? } = {};
  dataLoaded = false;
  workingCurrency = ''; //fix for undefined showing in title
  group: IGroup;

  private _viewNonGrouped;
  private _syncInitSub: Subscription;
  private _expenseCreatedOrUpdatedSub: Subscription;
  private _syncDataPushCompleteSub: Subscription;
  private _routeParamsSub: Subscription;

  constructor(private ngZone: NgZone, private activatedRoute: ActivatedRoute
    , private alertCtrl: AlertController, private popoverCtrl: PopoverController
    , private expenseSvc: ExpenseService, private groupSvc: GroupService
    , private currencySettingSvc: CurrencySettingService) { 
    super();

    this._subscribeToEvents();
  }

  async ngOnInit() {    
    this._routeParamsSub = this.activatedRoute.params.subscribe(async (params) => {
      let { groupId, viewNonGrouped } = params;

      if(viewNonGrouped) {
        this._viewNonGrouped = Boolean(viewNonGrouped);
      }

      if(groupId) {
        groupId = +groupId;
        this.group = await this.groupSvc.getByIdLocal(groupId);
        if(AppConstant.DEBUG) {
          console.log('ExpenseListingPage: ngOnInit: group', this.group);
        }
      }
    });

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

  async onSearchInputCleared() {
    this.searchTerm = null;
    await this._getExpenses();
  }

  async onAddClicked() {
    //unsynced group, you can't add item into it
    if(this.group && (this.group.markedForAdd || this.group.markedForUpdate || this.group.markedForDelete)) {
      return;
    }

    await this.navigate({ 
      path: '/expense/expense-create-or-update',
      params: {
        groupId: this.group?.id || ''
      } 
    });
  }

  async onExpenseItemClicked(ev: CustomEvent, expense: IExpense
    , action: 'detail' | 'edit' | 'delete') {
    ev.stopImmediatePropagation();
    
    if(action == 'detail') {
      await this.navigate({ path: '/expense/expense-detail', params: { id: expense.id }});
    }
  }

  async onSearchToggleClicked() {
    this.displaySearch = !this.displaySearch;
    if(!this.displaySearch) {
      await this.onSearchInputCleared();
    }
  }

  async onMoreOptionsClicked(eve) {
    const popCtrl = await this.popoverCtrl.create({
      component: ExpenseListingOption,
      event: eve
    });
    await popCtrl.present();

    const { data } = await popCtrl.onDidDismiss();
    if(data == 'add_member') {
      await this.onMemberAddClicked();
    }
  }

  async onMemberAddClicked() {
    await this.groupSvc.presentMemberModal(this.group.id);
  }

  async doRefresh(ev) {
    //reset
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);

    setTimeout(() => {
      ev.target.complete();
    }, 300);
  }

  onIonScrolling(ev: CustomEvent) {
    const { scrollTop } = ev.detail;
    if(scrollTop > 100) {
      this.displayHeaderbar = false;
    } else if(scrollTop <= 0) {
      this.displayHeaderbar = true;
    }
  } 

  ngOnDestroy() {
    if(this._routeParamsSub) {
      this._routeParamsSub.unsubscribe();
    }
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
    //reset
    await this.epListingContent.scrollToTop();
    this.dataLoaded = false;

    let filters:any = {
      fromDate: this.dates.selectedDate.from,
      toDate: this.dates.selectedDate.to,
      groupId: undefined  //by default show grouped and non-grouped
    };

    if(this.group || this._viewNonGrouped) {
      if(this.group) {
        filters.groupId = this.group.id;
      } else if(typeof this._viewNonGrouped != undefined) {
        filters.groupId = null;
      }
    }
 
    if(args && args.term) {
      filters.term = args.term;
    }

    this.ngZone.run(async () => {
      const currentMonth = moment().format('M');
      const fromDateMonth = moment(filters.fromDate).format('M');
      const toDateMonth = moment(filters.toDate).format('M');

      try {
        //if changed month is not same as current month, then we don't have entries local..
        if(currentMonth != fromDateMonth || currentMonth != toDateMonth) {
          this.expenses = await this.expenseSvc.getExpenses(filters);
        } else {
          this.expenses = await this.expenseSvc.getExpenseListLocal(filters);
        }
      } catch(e) {
        this.expenses = [];
      } finally {
        this.sum = this.expenses.reduce((a, b) => a + (+b.amount), 0);
        if(AppConstant.DEBUG) {
          console.log('ExpenseListingPage: _getExpenses: expenses', this.expenses);
        }
        this.dataLoaded = true;
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

    //EVENT_SYNC_DATA_PUSH_COMPLETE is fired by multiple sources, we debounce subscription to execute this once
    const obv = new Observable(observer => {
      //next will call the observable and pass parameter to subscription
      const callback = (params) => observer.next(params);
      const subc = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, callback);
      //will be called when unsubscribe calls
      return () => subc.unsubscribe()
    });
    this._syncDataPushCompleteSub = obv.pipe(debounceTime(500))
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

    //important to add here since the application loads and the view will show but there will be no data...
    //this is needed only when the application runs first time (i.e startup)
    // this._syncInitSub = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
    //   if(AppConstant.DEBUG) {
    //     console.log('ExpenseListingPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
    //   }
    //   await this._getExpenses();
    // });
  }
}

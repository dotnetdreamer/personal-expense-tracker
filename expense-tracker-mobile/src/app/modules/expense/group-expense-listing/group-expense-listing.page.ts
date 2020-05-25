import { Component, OnInit, ViewEncapsulation, OnDestroy, NgZone, ViewChild, AfterViewInit } from '@angular/core';

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
import { IGroup, GroupPeriodStatus } from '../../group/group.model';
import { GroupService } from '../../group/group.service';
import { ExpenseListingOption } from '../expense-listing/expense-listing-options.popover';

declare const window: any;

@Component({
  selector: 'page-group-expense-listing',
  templateUrl: './group-expense-listing.page.html',
  styleUrls: ['./group-expense-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GroupExpenseListingPage extends BasePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('epListingContent') epListingContent: IonContent;

  displayHeaderbar = true;
  expenses: Array<IExpense> = [];
  searchTerm: string;
  displaySearch = false;
  sum = 0;
  dates: { selectedDate?: { from, to, fromTime?, toTime? }, todayDate? } = {};
  dataLoaded = false;
  workingCurrency = ''; //fix for undefined showing in title
  group: IGroup;
  groupTotals = {
    actualPaidAmount: 0,
    totalBalance: 0,
    debits: 0
  };

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
      let { groupId } = params;

      this.dates.todayDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
      this.dates.selectedDate = <any>{};
      
      groupId = +groupId;
      this.group = await this.groupSvc.getByIdLocal(groupId);
      if(AppConstant.DEBUG) {
        console.log('ExpenseListingPage: ngOnInit: group', this.group);
      }

      //expenses must be filtered by periods
      const openPeriod = this.group.periods.filter(p => p.status == GroupPeriodStatus.Open)[0];

      const fromDate = moment(openPeriod.startDate).local().format(AppConstant.DEFAULT_DATETIME_FORMAT);
      const toDate = moment().endOf('M').format(AppConstant.DEFAULT_DATE_FORMAT);
      this.dates.selectedDate.from = fromDate;
      this.dates.selectedDate.to = toDate;

      this.dates.selectedDate.fromTime = moment(openPeriod.startDate).local()
        .format(AppConstant.DEFAULT_TIME_FORMAT);;
      this.dates.selectedDate.toTime = moment(openPeriod.startDate).local().endOf('D')
        .format(AppConstant.DEFAULT_TIME_FORMAT);
    });

    this.workingCurrency = await this.currencySettingSvc.getWorkingCurrency();
  }

  ngAfterViewInit() {
    //fix: navigation lag
    setTimeout(async () => {
      await this._getExpenses();
    }, 300);
  }

  groupHeaderFn(record: IExpense, recordIndex, records) {
    window.et = window.et || {};
    window.et.headers = window.et.headers || [];
    const createdOn =  moment(records[recordIndex].createdOn).format('YYYY-MM');

    let date = null;
    if(!(<string[]>window.et.headers).includes(createdOn)) {
      date = `${createdOn}`;
      (<string[]>window.et.headers).push(createdOn);
    }

    return date;
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
    if(this.group.markedForAdd || this.group.markedForUpdate || this.group.markedForDelete) {
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
      componentProps: {
        totalExpenses: this.expenses.length
      },
      event: eve
    });
    await popCtrl.present();

    const { data } = await popCtrl.onDidDismiss();
    switch(data) {
      case 'add_member':
        await this.onMemberAddClicked();
      break;
      case 'settle_up':
        const confirm = await this.helperSvc.presentConfirmDialog();
        if(!confirm) {
          return;
        }

        //all expenses must be synced before settling up
        const es = this.expenses.filter(e => e.markedForAdd || e.markedForUpdate || e.markedForDelete);
        if(es.length) {
          const msg = await this.localizationSvc.getResource('group.expenses_must_sync');
          await this.helperSvc.presentToast(msg, false);
          return;
        }
        
        const updatedGroup = await this.groupSvc.settleUpGroup(this.group);
        if(updatedGroup) {
          this.group = null;
          this.expenses = [];

          //refresh
          setTimeout(async () => {
            this.group = updatedGroup;
            this.groupTotals = {
              actualPaidAmount: 0,
              totalBalance: 0,
              debits: 0
            };

            //get the new period
            const openPeriod = this.group.periods.filter(p => p.status == GroupPeriodStatus.Open)[0];
            this.dates.selectedDate.from = moment(openPeriod.startDate).local().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            this.dates.selectedDate.fromTime = moment(openPeriod.startDate).local().format(AppConstant.DEFAULT_TIME_FORMAT);;

            //now get expenses
            await this._getExpenses();
          });
        }
      break;
    }
  }

  async onMemberAddClicked() {
    await this.groupSvc.presentMemberModal(this.group.id, (data) => {
      //always grab the latest info on close i.e to get any updated status on member aproval
      //TODO: need to grab the gorup from web and keep it local...
    });
  }

  async doRefresh(ev) {    
    //pull latest. Important as 'other members' in group need to have lastest information
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL, SyncEntity.Expense);

    //now push
    this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);

    setTimeout(() => {
      ev.target.complete();
    }, 300);
  }

  onIonScrolling(ev: CustomEvent) {
    const { scrollTop } = ev.detail;
    const top = this.group ? 180 : 120;
    if(scrollTop > top) {
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
    window.et ? window.et.headers = undefined : '';
  }

  private async _getExpenses(args?: { term? }) {
    //reset
    await this.epListingContent.scrollToTop();
    this.dataLoaded = false;
    window.et ? window.et.headers = undefined : '';

    let filters:any = {
      fromDate: this.dates.selectedDate.from,
      toDate: this.dates.selectedDate.to,
      fromTime: this.dates.selectedDate.fromTime,
      toTime: this.dates.selectedDate.toTime,
      groupId: this.group.id
    };
 
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
        //calculate actualPaidAmount and totalBalance
        const email = await this.userSettingSvc.getCurrentUser();
        const cuTransactions = this.expenses.map(e => e.transactions.filter(t => t.email == email)[0])
          .filter(e => e != null);
        if(cuTransactions.length) {
          this.groupTotals.actualPaidAmount = cuTransactions.reduce((a, b) => a + b.actualPaidAmount, 0);
        }

        this.sum = this.expenses.reduce((a, b) => a + (+b.amount), 0);
        const amountForCurrentMbr = 0;
        this.groupTotals.debits = 0;
        if(this.sum > 0) {
          const credits = cuTransactions.reduce((a, b) => a + (+b.credit), 0);
          const debits =  cuTransactions.reduce((a, b) => a + (+b.debit), 0);
          
          // this.groupTotals.totalBalance = credits - debits;
          this.groupTotals.totalBalance = this.groupTotals.actualPaidAmount - debits;
          this.groupTotals.debits = debits;
        }
        // const perMember = this.sum / this.group.members.length;
        // this.groupTotals.debits = this.groupTotals.actualPaidAmount - perMember;
        // if(this.sum > 0) {
        //   this.groupTotals.totalBalance = this.sum / this.group.members.length;
        // }

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

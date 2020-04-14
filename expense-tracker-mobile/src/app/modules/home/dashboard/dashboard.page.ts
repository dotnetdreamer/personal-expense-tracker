import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

import * as moment from 'moment';
import { Subscription, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ExpenseService } from '../../expense/expense.service';
import { AppConstant } from '../../shared/app-constant';
import { BasePage } from '../../shared/base.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { CurrencySettingService } from '../../currency/currency-setting.service';

import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexXAxis, ApexPlotOptions,
  ApexNonAxisChartSeries, ApexLegend, ApexYAxis, ApexGrid, ApexStroke, ApexTitleSubtitle
} from "ng-apexcharts";
import { IExpenseDashboardReport, IExpense } from '../../expense/expense.model';
import { AlertController } from '@ionic/angular';
import { GroupService } from '../../group/group.service';
import { SyncEntity } from '../../shared/sync/sync.model';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
};

export type DateChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
};

export type CategoryChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: any;
  legend: ApexLegend;
};

@Component({
  selector: 'page-home-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage extends BasePage implements AfterViewInit, OnDestroy {
  // @ViewChild("dateChart") categoryChart: ChartComponent;
    // @ViewChild("categoryChart") categoryChart: ChartComponent;
  totalChartOptions: Partial<ChartOptions>;
  dateChartOptions: Partial<DateChartOptions>;
  categoryChartOptions: Partial<CategoryChartOptions>;

  totalAmount = 0;
  DEFAULT_DATE_FORMAT = AppConstant.DEFAULT_DATE_FORMAT;
  selectedFromDate;
  selectedToDate;
  workingCurrency;

  todayExpenses: IExpense[];
  todayDate;
  totalAmountToday = 0;

  private _syncDataPushCompleteSub: Subscription;
  private _syncDataPullCompleteSub: Subscription;
  private _eventCreatedOrUpdatedSub: Subscription;

  constructor(private alertCtrl: AlertController
    , private expenseSvc: ExpenseService, private groupSvc: GroupService
    , private currencySettingSvc: CurrencySettingService) { 
    super();
    
    this._subscribeToEvents();

    this.selectedFromDate = moment().add(-6, 'd').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.selectedToDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
  }

  async ngAfterViewInit() {
    this.todayDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
    this.workingCurrency = await this.currencySettingSvc.getWorkingCurrency();
  }

  async onDateSelectionChanged($event: CustomEvent, prop: 'fromDate' | 'toDate') {
    const d = moment($event.detail.value).format(AppConstant.DEFAULT_DATE_FORMAT);

    await this._renderCharts(prop == 'fromDate' ? d : this.selectedFromDate
      , prop == 'toDate' ? d : this.selectedToDate);
  }

  async onAddClick(actionType: 'expense' | 'group') {
    if(actionType == 'expense') {
      await this.navigate({ path: '/expense/expense-create-or-update'})
    } else if(actionType === 'group') {
      await this._presentAddGroupModal();
    }
  }

  async doRefresh(ev) {
    //reset
    this.selectedFromDate = moment().add(-6, 'd').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.selectedToDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);

    this.todayExpenses = [];
    this.totalAmountToday = 0;
    setTimeout(async () => {
      await this._getTodayExpenses();
    });

    this.totalAmount = 0;
    this.totalChartOptions.series = [];
    this.totalChartOptions.xaxis.categories = [];
    this.dateChartOptions.series = [];
    this.dateChartOptions.xaxis.categories = [];
    this.categoryChartOptions.series = [];
    this.categoryChartOptions.labels = [];
    await this._renderCharts(this.selectedFromDate, this.selectedToDate);

    setTimeout(() => {
      ev.target.complete();
    }, 300);
  }

  async onViewAllExpensesClicked() {
    await this.navigate({ path: '/expense/expense-listing' });
  }

  ngOnDestroy() {
    if(this._syncDataPullCompleteSub) {
      this._syncDataPullCompleteSub.unsubscribe();
    }
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
    if(this._eventCreatedOrUpdatedSub) {
      this._eventCreatedOrUpdatedSub.unsubscribe();
    }
  }

  private async _presentAddGroupModal() {
      const resources = await Promise.all([
        this.localizationSvc.getResource('group.add')
        , this.localizationSvc.getResource('group.name')
        , this.localizationSvc.getResource('common.cancel')
      ]);

      const title = resources[0];
      const alert = await this.alertCtrl.create({
        header: title,
        inputs: [
          {
            name: 'name',
            type: 'text',
            placeholder: resources[1]
          }
        ],
        buttons: [
          {
            text: resources[2],
            role: 'cancel',
            cssClass: 'secondary',
            // handler: () => {
            // }
          }, {
            text: 'Ok',
            handler: async (data) => {
              if(!data.name) {
                return;
              }
  
              if(!data.name.trim().length) {
                return;
              }
  
              await this.groupSvc.putLocal({
                name: data.name,
                entityName: SyncEntity.Expense,
                guid: this.helperSvc.generateGuid()
              });   
              this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Group);
            }
          }
        ]
    });
    await alert.present();
  }
    
  private async _getTodayExpenses() {
    this.todayExpenses = await this.expenseSvc.getExpenseListLocal({ 
      fromDate: this.todayDate, 
      toDate: this.todayDate,
      pageSize: 3 //only 3 items...
    });
    this.totalAmountToday = this.todayExpenses.reduce((a, b) => a + (+b.amount), 0);

    if(AppConstant.DEBUG) {
      console.log('DashboardPage: _getTodayExpenses: todayExpenses', this.todayExpenses);
    }
  }

  private async _renderCharts(fromDate, toDate) {
    const currentMonth = +moment().format('M');
    const selectedFromDateMonth = +moment(fromDate, AppConstant.DEFAULT_DATE_FORMAT).format('M');
    const selectedToDateMonth = +moment(toDate, AppConstant.DEFAULT_DATE_FORMAT).format('M');

    let report: IExpenseDashboardReport;
    try {
      //if selected month is not same as current month, then we don't have entries local..
      //fetch it from online...
      if(selectedFromDateMonth != currentMonth || selectedToDateMonth != currentMonth) {
        report = await this.expenseSvc.getReport(fromDate, toDate);
      } else {
        report = await this.expenseSvc.getReportLocal(fromDate, toDate);
      }
      if(AppConstant.DEBUG) {
        console.log('DashboardPage: _renderCharts: report', report);
      }
    } catch(e) {
      //hide skeleton screen
      report = {
        categories: [],
        dates: []
      }
    }

    const resoures = await Promise.all([
      this.localizationSvc.getResource('expense.total')
    ]);
    let categories = report.categories;
    let dates = report.dates;
    this.totalAmount = categories.reduce((a, b) => a + (+b.totalAmount), 0);
    
    const dateTotalAmounts = dates.map(d => d.totalAmount);
    const dateLabels = dates.map(d => d.label);

    const categoryTotalAmounts = categories.map(r => r.totalAmount);
    const categoryLabels = categories.map(r => r.label);

    this.totalChartOptions = {
      series: [
        {
          name: resoures[0],
          data: categoryTotalAmounts
        }
      ],
      chart: {
        height: 90,
        // width: 150,
        type: "line",
        background: 'transparent',
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "straight"
      },
      grid: {
        show: false,
      },
      yaxis: {
        show: false
      },
      xaxis: {
        labels: {
          show: false
        },
        categories: categoryLabels
      }
    };

    this.dateChartOptions = {
      series: [
        {
          name: resoures[0],
          data: dateTotalAmounts
        }
      ],
      chart: {
        type: "bar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: dateLabels
      }
    };
  
    this.categoryChartOptions = {
      series: categoryTotalAmounts,
      chart: {
        height: 320,
        type: "pie"
      },
      legend: {
        position: 'bottom'
      },
      labels: categoryLabels
    };
  }

  private _subscribeToEvents() {
    this._syncDataPullCompleteSub = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
      }
      await this._getTodayExpenses();
      await this._renderCharts(this.selectedFromDate, this.selectedToDate);
    });

    this._eventCreatedOrUpdatedSub = this.pubsubSvc.subscribe(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, async () => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage:Event received: EVENT_EXPENSE_CREATED_OR_UPDATED');
      }
      await this._getTodayExpenses();
      await this._renderCharts(this.selectedFromDate, this.selectedToDate);
    });

    //we add item...after successfuly sync, reload to hide that spinner icon from each expense item
    //EVENT_SYNC_DATA_PUSH_COMPLETE is fired by multiple sources, we debounce subscription to execute this once
    const obv = new Observable(observer => {
      //next will call the observable and pass parameter to subscription
      const callback = (params) => observer.next(params);
      const subc = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, callback);
      //will be called when unsubscribe calls
      return () => subc.unsubscribe()
    });
    this._syncDataPushCompleteSub = obv.pipe(debounceTime(500))
    .subscribe(async () => {
        if(AppConstant.DEBUG) {
          console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
        }

        await this._getTodayExpenses();
        await this._renderCharts(this.selectedFromDate, this.selectedToDate);
    });
    
  }
}

import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

import * as moment from 'moment';

import { ExpenseService } from '../../expense/expense.service';
import { AppConstant } from '../../shared/app-constant';
import { BasePage } from '../../shared/base.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { Subscription } from 'rxjs';
import { CurrencySettingService } from '../../currency/currency-setting.service';

import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
  ApexNonAxisChartSeries,
  ApexResponsive
} from "ng-apexcharts";
import { IExpenseDashboardReport } from '../../expense/expense.model';

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
};

@Component({
  selector: 'page-home-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage extends BasePage implements AfterViewInit, OnDestroy {
  // @ViewChild("categoryChart") categoryChart: ChartComponent;
  // @ViewChild("dateChart") categoryChart: ChartComponent;
  categoryChartOptions: Partial<CategoryChartOptions>;
  dateChartOptions: Partial<DateChartOptions>;

  totalAmount = 0;
  DEFAULT_DATE_FORMAT = AppConstant.DEFAULT_DATE_FORMAT;
  selectedFromDate;
  selectedToDate;
  workingCurrency;

  private _syncDataPushCompleteSub: Subscription;

  constructor(private expenseSvc: ExpenseService, private currencySettingSvc: CurrencySettingService) { 
    super();
    
    this._subscribeToEvents();

    this.selectedFromDate = moment().add(-7, 'd').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.selectedToDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
  }

  async ngAfterViewInit() {
    this.workingCurrency = await this.currencySettingSvc.getWorkingCurrency();
  }

  async onDateSelectionChanged($event: CustomEvent, prop: 'fromDate' | 'toDate') {
    const d = moment($event.detail.value).format(AppConstant.DEFAULT_DATE_FORMAT);

    await this._renderCharts(prop == 'fromDate' ? d : this.selectedFromDate
      , prop == 'toDate' ? d : this.selectedToDate);
  }

  async onAddClick() {
    await this.navigate({ path: '/expense/expense-create-or-update'})
  }

  async doRefresh(ev) {
    //reset
    this.selectedFromDate = moment().add(-7, 'd').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.selectedToDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);

    await this._renderCharts(this.selectedFromDate, this.selectedToDate);
    setTimeout(() => {
      ev.target.complete();
    }, 300);
  }

  ngOnDestroy() {
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
  }

  private async _renderCharts(fromDate, toDate) {
    const currentMonth = +moment().format('M');
    const selectedFromDateMonth = +moment(fromDate, AppConstant.DEFAULT_DATE_FORMAT).format('M');
    const selectedToDateMonth = +moment(toDate, AppConstant.DEFAULT_DATE_FORMAT).format('M');

    let report: IExpenseDashboardReport;
    //if selected month is not same as current month, then we don't have entries local..
    //fetch it from online...
    if(selectedFromDateMonth != currentMonth || selectedToDateMonth != currentMonth) {
      report = await this.expenseSvc.getReport(fromDate, toDate);
    } else {
      report = await this.expenseSvc.getReportLocal(fromDate, toDate);
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

    this.dateChartOptions = {
      series: [
        {
          name: resoures[0],
          data: dateTotalAmounts
        }
      ],
      chart: {
        type: "bar",
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: true
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: dateLabels
      }
    };
   
    this.categoryChartOptions = {
      series: categoryTotalAmounts,
      chart: {
        // width: 320,
        type: "pie"
      },
      labels: categoryLabels
    };
  }

  private _subscribeToEvents() {
    this._syncDataPushCompleteSub = this.eventPub.$sub(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
      }
      await this._renderCharts(this.selectedFromDate, this.selectedToDate);
    });
  }
}

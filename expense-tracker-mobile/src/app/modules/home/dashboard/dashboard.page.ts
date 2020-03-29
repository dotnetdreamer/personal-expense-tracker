import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

import * as moment from 'moment';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle
} from "ng-apexcharts";
import { ExpenseService } from '../../expense/expense.service';
import { AppConstant } from '../../shared/app-constant';
import { BasePage } from '../../shared/base.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { Subscription } from 'rxjs';
import { CurrencySettingService } from '../../currency/currency-setting.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'page-home-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage extends BasePage implements AfterViewInit, OnDestroy {
  @ViewChild("chart") chart: ChartComponent;
  chartOptions: Partial<ChartOptions>;
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
    const report = await this.expenseSvc.getReportByCategory(fromDate, toDate);
    this.totalAmount = report.reduce((a, b) => a + (+b.totalAmount), 0);
    
    const totals = report.map(r => r.totalAmount);
    const categories = report.map(r => r.categoryName);

    this.chartOptions = {
      series: [
        {
          name: "Spending",
          data: totals
        }
      ],
      chart: {
        height: 300,
        type: "bar"
      },
      // title: {
      //   text: "My First Angular Chart"
      // },
      xaxis: {
        categories: categories
      }
    };
  }

  private _subscribeToEvents() {
    this._syncDataPushCompleteSub = this.eventPub.$sub(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('DashboardPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
      }
      await this._renderCharts(this.selectedFromDate, this.selectedToDate);
    });
  }
}

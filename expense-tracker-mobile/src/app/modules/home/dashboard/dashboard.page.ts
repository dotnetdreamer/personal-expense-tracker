import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

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
export class DashboardPage implements AfterViewInit {
  @ViewChild("chart") chart: ChartComponent;
  chartOptions: Partial<ChartOptions>;
  DEFAULT_DATE_FORMAT = AppConstant.DEFAULT_DATE_FORMAT;
  selectedFromDate;
  selectedToDate;

  constructor(private expenseSvc: ExpenseService) { 
    this.selectedFromDate = moment().add(-7, 'd').format(AppConstant.DEFAULT_DATE_FORMAT);
    this.selectedToDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
  }

  async ngAfterViewInit() {
    await this._render(this.selectedFromDate, this.selectedToDate);
  }

  async onDateSelectionChanged($event: CustomEvent, prop: 'fromDate' | 'toDate') {
    const d = moment($event.detail.value).format(AppConstant.DEFAULT_DATE_FORMAT);

    await this._render(prop == 'fromDate' ? d : this.selectedFromDate
      , prop == 'toDate' ? d : this.selectedToDate);
  }

  private async _render(fromDate, toDate) {
    const report = await this.expenseSvc.getReportByCategory(fromDate, toDate);

    const totals = report.map(r => r.total);
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
}

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

  constructor(private expenseSvc: ExpenseService) { 
  }

  async ngAfterViewInit() {
    await this._render();
  }

  private async _render() {
    const fromDate = moment().add(-7, 'd').format(AppConstant.DEFAULT_DATE_FORMAT);
    const toDate = moment().format(AppConstant.DEFAULT_DATE_FORMAT);

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
        height: 350,
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

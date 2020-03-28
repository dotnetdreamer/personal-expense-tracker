import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    DashboardPageRoutingModule,
    NgApexchartsModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}

import { NgModule } from '@angular/core';


import { ExpenseDetailPageRoutingModule } from './expense-detail-routing.module';

import { ExpenseDetailPage } from './expense-detail.page';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ExpenseDetailOption } from './expense-option.popover';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    ExpenseDetailPageRoutingModule
  ],
  declarations: [ExpenseDetailPage, ExpenseDetailOption]
})
export class ExpenseDetailPageModule {}

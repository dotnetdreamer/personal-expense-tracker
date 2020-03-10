import { NgModule } from '@angular/core';

import { ExpenseCreateOrUpdatePageRoutingModule } from './expense-create-or-update-routing.module';

import { ExpenseCreateOrUpdatePage } from './expense-create-or-update.page';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    ExpenseCreateOrUpdatePageRoutingModule
  ],
  declarations: [ExpenseCreateOrUpdatePage]
})
export class ExpenseCreateOrUpdatePageModule {}

import { NgModule } from '@angular/core';

import { ExpenseListingPageRoutingModule } from './expense-listing-routing.module';

import { ExpenseListingPage } from './expense-listing.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    ExpenseListingPageRoutingModule
  ],
  declarations: [ExpenseListingPage]
})
export class ExpenseListingPageModule {}

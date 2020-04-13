import { NgModule } from '@angular/core';

import { ExpenseListingPageRoutingModule } from './expense-listing-routing.module';

import { ExpenseListingPage } from './expense-listing.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { ExpenseListingOption } from './expense-listing-options.popover';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    ExpenseListingPageRoutingModule
  ],
  declarations: [ExpenseListingPage, ExpenseListingOption]
})
export class ExpenseListingPageModule {}

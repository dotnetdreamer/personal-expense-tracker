import { NgModule } from '@angular/core';

import { ExpenseListingPageRoutingModule } from './expense-listing-routing.module';

import { ExpenseListingPage } from './expense-listing.page';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    ExpenseListingPageRoutingModule
  ],
  declarations: [ExpenseListingPage]
})
export class ExpenseListingPageModule {}

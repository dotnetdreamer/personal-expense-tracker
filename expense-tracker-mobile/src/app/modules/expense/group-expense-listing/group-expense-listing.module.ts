import { NgModule } from '@angular/core';

import { GroupExpenseListingPageRoutingModule } from './group-expense-listing-routing.module';

import { GroupExpenseListingPage } from './group-expense-listing.page';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    GroupExpenseListingPageRoutingModule
  ],
  declarations: [GroupExpenseListingPage]
})
export class GroupExpenseListingPageModule {}

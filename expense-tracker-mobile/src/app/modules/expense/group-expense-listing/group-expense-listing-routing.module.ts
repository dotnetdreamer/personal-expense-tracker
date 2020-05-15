import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupExpenseListingPage } from './group-expense-listing.page';

const routes: Routes = [
  {
    path: '',
    component: GroupExpenseListingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupExpenseListingPageRoutingModule {}

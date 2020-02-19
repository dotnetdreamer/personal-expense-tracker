import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExpenseListingPage } from './expense-listing.page';

const routes: Routes = [
  {
    path: '',
    component: ExpenseListingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExpenseListingPageRoutingModule {}

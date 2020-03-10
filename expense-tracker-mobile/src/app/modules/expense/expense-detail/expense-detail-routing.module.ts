import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExpenseDetailPage } from './expense-detail.page';

const routes: Routes = [
  {
    path: '',
    component: ExpenseDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExpenseDetailPageRoutingModule {}

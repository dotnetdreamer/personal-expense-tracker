import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExpenseCreateOrUpdatePage } from './expense-create-or-update.page';

const routes: Routes = [
  {
    path: '',
    component: ExpenseCreateOrUpdatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExpenseCreateOrUpdatePageRoutingModule {}

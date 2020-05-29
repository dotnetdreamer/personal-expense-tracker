import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserEditPage } from './user-edit.page';

const routes: Routes = [
  {
    path: '',
    component: UserEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserEditPageRoutingModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserListingPage } from './user-listing.page';

const routes: Routes = [
  {
    path: '',
    component: UserListingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserListingPageRoutingModule {}

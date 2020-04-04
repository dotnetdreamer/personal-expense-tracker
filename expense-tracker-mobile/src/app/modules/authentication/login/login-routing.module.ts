import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginPage } from './login.page';
import { BackButtonDisableService } from '../../shared/back-button/backbutton-disable.service';

const routes: Routes = [
  {
    path: '',
    component: LoginPage,
    canDeactivate: [BackButtonDisableService]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}

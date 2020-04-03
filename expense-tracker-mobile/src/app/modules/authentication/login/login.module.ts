import { NgModule } from '@angular/core';

import { LoginPageRoutingModule } from './login-routing.module';

import { LoginPage } from './login.page';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    LoginPageRoutingModule
  ],
  declarations: [LoginPage],
  providers: []
})
export class LoginPageModule {}

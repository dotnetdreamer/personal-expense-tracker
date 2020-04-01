import { NgModule } from '@angular/core';

import { LoginPageRoutingModule } from './login-routing.module';

import { LoginPage } from './login.page';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { AuthenticationGoogleService } from '../authentication-google.service';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    LoginPageRoutingModule
  ],
  declarations: [LoginPage],
  providers: [AuthenticationGoogleService]
})
export class LoginPageModule {}

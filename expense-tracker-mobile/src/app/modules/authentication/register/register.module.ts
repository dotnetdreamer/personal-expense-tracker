import { NgModule } from '@angular/core';

import { RegisterPageRoutingModule } from './register-routing.module';

import { RegisterPage } from './register.page';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule,
    RegisterPageRoutingModule
  ],
  declarations: [RegisterPage]
})
export class RegisterPageModule {}

import { NgModule } from '@angular/core';

import { UserEditPageRoutingModule } from './user-edit-routing.module';

import { UserEditPage } from './user-edit.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';

@NgModule({
  imports: [
    PipesModule,
    ComponentsWithFormsModule,
    UserEditPageRoutingModule
  ],
  declarations: [UserEditPage]
})
export class UserEditPageModule {}

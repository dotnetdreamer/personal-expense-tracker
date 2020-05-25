import { NgModule } from '@angular/core';

import { UserListingPageRoutingModule } from './user-listing-routing.module';
import { UserListingPage } from './user-listing.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    UserListingPageRoutingModule
  ],
  declarations: [UserListingPage]
})
export class UserListingPageModule {}

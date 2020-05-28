import { NgModule } from '@angular/core';

import { UserListingPageRoutingModule } from './user-listing-routing.module';
import { UserListingPage } from './user-listing.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { UserListingOptionComponent } from './user-listing-option';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    UserListingPageRoutingModule
  ],
  declarations: [UserListingPage, UserListingOptionComponent]
})
export class UserListingPageModule {}

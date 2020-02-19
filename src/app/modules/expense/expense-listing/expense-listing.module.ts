import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ExpenseListingPageRoutingModule } from './expense-listing-routing.module';

import { ExpenseListingPage } from './expense-listing.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExpenseListingPageRoutingModule
  ],
  declarations: [ExpenseListingPage]
})
export class ExpenseListingPageModule {}

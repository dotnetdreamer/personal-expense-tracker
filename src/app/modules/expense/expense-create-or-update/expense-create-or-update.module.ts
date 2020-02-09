import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ExpenseCreateOrUpdatePageRoutingModule } from './expense-create-or-update-routing.module';

import { ExpenseCreateOrUpdatePage } from './expense-create-or-update.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExpenseCreateOrUpdatePageRoutingModule
  ],
  declarations: [ExpenseCreateOrUpdatePage]
})
export class ExpenseCreateOrUpdatePageModule {}

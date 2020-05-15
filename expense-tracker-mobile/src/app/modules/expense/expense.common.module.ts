import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransactionTypeModal } from './transaction-type/transaction-type.page';
import { TransactionTypePageModule } from './transaction-type/transaction-type.module';

const routes: Routes = [ 
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'expense-listing'
    },
    {
      path: 'expense-listing',
      loadChildren: () => import('./expense-listing/expense-listing.module').then( m => m.ExpenseListingPageModule)
    },
    {
      path: 'group-expense-listing',
      loadChildren: () => import('./group-expense-listing/group-expense-listing.module').then( m => m.GroupExpenseListingPageModule)
    },
    {
      path: 'expense-create-or-update',
      loadChildren: () => import('./expense-create-or-update/expense-create-or-update.module').then( m => m.ExpenseCreateOrUpdatePageModule)
    },
    {
      path: 'expense-detail',
      loadChildren: () => import('./expense-detail/expense-detail.module').then( m => m.ExpenseDetailPageModule)
    }  
];

@NgModule({
  imports: [
    TransactionTypePageModule,        
    RouterModule.forChild(routes)
  ],
  declarations: [],
  providers: []
})
export class ExpenseCommonModule {}

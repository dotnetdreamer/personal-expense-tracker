import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

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
    // ComponentsWithOutFormsModule,        
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class ExpenseCommonModule {}

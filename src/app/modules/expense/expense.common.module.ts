import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartupResolver } from '../shared/startup.resolve';

const routes: Routes = [ 
    {
        path: 'expense-create-or-update',
        loadChildren: () => import('./expense-create-or-update/expense-create-or-update.module').then( m => m.ExpenseCreateOrUpdatePageModule),
        resolve: {
          startupResolve: StartupResolver
        }
    },
    {
      path: 'expense-listing',
      loadChildren: () => import('./expense-listing/expense-listing.module').then( m => m.ExpenseListingPageModule),
      resolve: {
        startupResolve: StartupResolver
      }
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

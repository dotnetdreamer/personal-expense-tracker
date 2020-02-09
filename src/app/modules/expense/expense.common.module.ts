import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [ 
    {
        path: 'expense-create-or-update',
        loadChildren: () => import('./expense-create-or-update/expense-create-or-update.module').then( m => m.ExpenseCreateOrUpdatePageModule)
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

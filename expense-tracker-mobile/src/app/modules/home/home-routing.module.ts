import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: HomePage,
    children: [
      {
        path: 'expense',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../expense/expense-listing/expense-listing.module').then(m => m.ExpenseListingPageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/home/tabs/expense',
        pathMatch: 'full'
      }
    ]

  },
  {
    path: '',
    redirectTo: '/home/tabs/expense',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule {}

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'home',
  //   pathMatch: 'full'
  // },
  {
    path: 'home',
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'list', 
    loadChildren: () => import('./list/list.module').then(m => m.ListPageModule)
  },
  {
    path: 'category',
    loadChildren: () => import('./modules/category/category.module').then( m => m.CategoryPageModule)
  },
  {
    path: 'expense',
    loadChildren: () => import('./modules/expense/expense.common.module').then( m => m.ExpenseCommonModule)
  },
  {
    path: 'general',
    loadChildren: () => import('./modules/general/general.common.module').then( m => m.GeneralCommonModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

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
  {
    path: 'user',
    loadChildren: () => import('./modules/authentication/authentication.common.module').then( m => m.AuthenticationCommonModule)
  },
  {
    path: 'group',
    loadChildren: () => import('./modules/group/group.common.module').then( m => m.GroupCommonModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

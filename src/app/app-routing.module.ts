import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { StartupResolver } from './modules/shared/startup.resolve';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomePageModule),
    resolve: {
      startupResolve: StartupResolver
    }
  },
  {
    path: 'list', 
    loadChildren: () => import('./list/list.module').then(m => m.ListPageModule)
  },
  {
    path: 'category',
    loadChildren: () => import('./modules/category/category.module').then( m => m.CategoryPageModule),
    resolve: {
      startupResolve: StartupResolver
    }
  },
  {
    path: 'expense',
    loadChildren: () => import('./modules/expense/expense.common.module').then( m => m.ExpenseCommonModule),
    resolve: {
      startupResolve: StartupResolver
    }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

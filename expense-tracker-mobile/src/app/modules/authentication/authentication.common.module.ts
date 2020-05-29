import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [ 
    {
        path: 'login',
        loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
    },
    {
      path: 'register',
      loadChildren: () => import('./register/register.module').then( m => m.RegisterPageModule)
    },
    {
      path: 'user-listing',
      loadChildren: () => import('./user-listing/user-listing.module').then( m => m.UserListingPageModule)
    },
    {
      path: 'user-edit',
      loadChildren: () => import('./user-edit/user-edit.module').then( m => m.UserEditPageModule)
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class AuthenticationCommonModule {}

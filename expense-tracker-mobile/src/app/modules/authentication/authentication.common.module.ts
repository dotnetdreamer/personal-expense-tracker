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
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  providers: []
})
export class AuthenticationCommonModule {}

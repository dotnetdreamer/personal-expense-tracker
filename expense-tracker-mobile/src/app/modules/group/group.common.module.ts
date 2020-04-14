import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GroupMemberModalModule } from './group-member/group-member.module';

const routes: Routes = [ 
    // {
    //   path: 'group-member',
    //   loadChildren: () => import('./group-member/group-member.module').then( m => m.GroupMemberModalModule)
    // } 
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    GroupMemberModalModule
  ],
  declarations: [],
  providers: []
})
export class GroupCommonModule {}

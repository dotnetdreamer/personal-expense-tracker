import { NgModule } from '@angular/core';

import { GroupMemberModal } from './group-member.modal';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule
  ],
  declarations: [GroupMemberModal]
})
export class GroupMemberModalModule {}

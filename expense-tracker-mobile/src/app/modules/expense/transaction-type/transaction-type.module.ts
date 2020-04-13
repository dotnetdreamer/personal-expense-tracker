import { NgModule } from '@angular/core';

import { TransactionTypeModal } from './transaction-type.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithFormsModule } from 'src/app/components/components-with-forms.module';

@NgModule({
  imports: [
    ComponentsWithFormsModule,
    PipesModule
  ],
  declarations: [TransactionTypeModal],
  exports: [TransactionTypeModal]
})
export class TransactionTypePageModule {}
 
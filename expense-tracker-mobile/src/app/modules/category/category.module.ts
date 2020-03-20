import { NgModule } from '@angular/core';

import { CategoryPageRoutingModule } from './category-routing.module';

import { CategoryPage } from './category.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';
import { CategoryOptionsPopover } from './category-option.popover';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    CategoryPageRoutingModule
  ],
  declarations: [CategoryPage, CategoryOptionsPopover]
})
export class CategoryPageModule {}

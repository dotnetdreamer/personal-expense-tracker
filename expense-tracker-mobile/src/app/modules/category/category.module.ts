import { NgModule } from '@angular/core';

import { CategoryPageRoutingModule } from './category-routing.module';

import { CategoryPage } from './category.page';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    PipesModule,
    CategoryPageRoutingModule
  ],
  declarations: [CategoryPage]
})
export class CategoryPageModule {}

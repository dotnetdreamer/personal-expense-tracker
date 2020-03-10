import { NgModule } from '@angular/core';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { ComponentsWithOutFormsModule } from 'src/app/components/components-without-forms.module';

@NgModule({
  imports: [
    ComponentsWithOutFormsModule,
    HomePageRoutingModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}

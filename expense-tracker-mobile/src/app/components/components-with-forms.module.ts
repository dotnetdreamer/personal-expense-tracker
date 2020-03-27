import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { NoDataModule } from './no-data/no-data.module';
import { CalendarSwiperModule } from './calendar-swiper/calendar-swiper.module';


@NgModule({
  imports: [
    NoDataModule,
    CalendarSwiperModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule
  ],
  declarations: [

  ],
  entryComponents: [

  ],
  exports: [
    NoDataModule,
    CalendarSwiperModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule

  ]
})
export class ComponentsWithFormsModule {}

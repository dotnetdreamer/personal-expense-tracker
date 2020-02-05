import { Component, OnInit } from '@angular/core';

import { CategoryService } from './category.service';
import { AppConstant } from '../shared/app-constant';
import { HelperService } from '../shared/helper.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage implements OnInit {
  categories = [];

  constructor(private categorySvc: CategoryService
    , private helperSvc: HelperService) { 

  }

  async ngOnInit() {
    await this.getCategories();
  }

  async onCategoryAddClick() {
    try {
      await this.categorySvc.put({
        name: 'Testing'
      });

      await this.getCategories();
    } catch (e) {
      if(AppConstant.DEBUG) {
        console.log('CategoryPage: onCategoryAddClick: error', e);
      }
      await this.helperSvc.presentToast('Category add failed');
    }
  }

  private async getCategories() {
    this.categories = await this.categorySvc.getCategoryList();
    if(AppConstant.DEBUG) {
      console.log('CategoryPage: ngOnInit: categories', this.categories);
    }
  }

}

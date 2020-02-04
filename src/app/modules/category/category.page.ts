import { Component, OnInit } from '@angular/core';
import { CategoryService } from './category.service';
import { AppConstant } from '../shared/app-constant';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage implements OnInit {
  categories = [];

  constructor(private categorySvc: CategoryService) { 

  }

  async ngOnInit() {
    this.categories = await this.categorySvc.getCategoryList();
    if(AppConstant.DEBUG) {
      console.log('CategoryPage: ngOnInit: categories', this.categories);
    }
  }

}

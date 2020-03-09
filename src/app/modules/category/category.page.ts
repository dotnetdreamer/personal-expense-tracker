import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

import { CategoryService } from './category.service';
import { AppConstant } from '../shared/app-constant';
import { HelperService } from '../shared/helper.service';
import { LocalizationService } from '../shared/localization.service';
import { ICategory } from './category.model';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage implements OnInit {
  categories: ICategory[] = [];
  gorupedItems: Map<string, ICategory[]>;

  private _orignalCategories: ICategory[] = [];

  constructor(private alertCtrl: AlertController
    , private categorySvc: CategoryService, private localizationSvc: LocalizationService
    , private helperSvc: HelperService) { 

  }

  async ngOnInit() {
    await this._getCategories();
  }

  async onCategoryAddClick() {
    try {
      await this._presentAddModal();
    } catch (e) {
      if(AppConstant.DEBUG) {
        console.log('CategoryPage: onCategoryAddClick: error', e);
      }
      await this.helperSvc.presentToast('Category add failed');
    }
  }

  async onIonSearchInput(args: CustomEvent) {
    let { data } = args.detail;
    
    if(data && data.length) {
      const filtered = this._orignalCategories.filter(c => c.name.toLowerCase().includes(data.toLowerCase()));
      await this._getCategories(filtered);
    } else {
      await this._getCategories();
    }
  }

  private async _getCategories(categoryList?) {
    if(!categoryList) {
      this._orignalCategories = await this.categorySvc.getCategoryList();
      this.categories = this._orignalCategories;
    } else {
      this.categories = categoryList;
    }

    this.gorupedItems = this.categories.groupBy<ICategory>(c => c.groupName);
    if(AppConstant.DEBUG) {
      console.log('CategoryPage: ngOnInit: gorupedItems', this.gorupedItems);
    }
  }

  private async _presentAddModal() {
    const catNameTitle = await this.localizationSvc.getResource('category.title');
    const alert = await this.alertCtrl.create({
      header: catNameTitle,
      inputs: [
        {
          name: 'categoryName',
          type: 'text',
          placeholder: ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Ok',
          handler: async (data) => {
            if(!data.categoryName) {
              return;
            }

            if(!data.categoryName.trim().length) {
              return;
            }

            await this.categorySvc.put({
              name: data.categoryName,
              groupName: ''
            });   

            await this._getCategories();
          }
        }
      ]
    });

    await alert.present();
  }

}

import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';

import { CategoryService } from './category.service';
import { AppConstant } from '../shared/app-constant';
import { HelperService } from '../shared/helper.service';
import { LocalizationService } from '../shared/localization.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage implements OnInit {
  categories = [];

  constructor(private alertCtrl: AlertController
    , private categorySvc: CategoryService, private localizationSvc: LocalizationService
    , private helperSvc: HelperService) { 

  }

  async ngOnInit() {
    await this.getCategories();
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

  private async getCategories() {
    this.categories = await this.categorySvc.getCategoryList();
    if(AppConstant.DEBUG) {
      console.log('CategoryPage: ngOnInit: categories', this.categories);
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

            await this.getCategories();
          }
        }
      ]
    });

    await alert.present();
  }

}

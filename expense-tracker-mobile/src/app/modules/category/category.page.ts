import { Component, OnInit, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';

import { CategoryService } from './category.service';
import { AppConstant } from '../shared/app-constant';
import { HelperService } from '../shared/helper.service';
import { LocalizationService } from '../shared/localization.service';
import { ICategory } from './category.model';
import { EventPublisher } from '../shared/event-publisher';
import { BasePage } from '../shared/base.page';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage extends BasePage implements OnInit {
  @Input() isOpenedAsModal;

  categories: ICategory[] = [];
  gorupedItems: Map<string, ICategory[]>;

  private _orignalCategories: ICategory[] = [];

  constructor(private alertCtrl: AlertController, private modalCtrl: ModalController
    , private categorySvc: CategoryService) { 
      super();
  }

  async ngOnInit() {
    await this._getCategories();
  }

  async onCategoryClicked(category: ICategory) {
    if(this.isOpenedAsModal) {
      await this.onCloseModalClicked(category);
    }
  }

  async onCloseModalClicked(data) {
    await this.modalCtrl.dismiss(data);
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

  async onIonSearchInput(args) {
    let data = args.target.value;

    if(data && data.length) {
      data = data.toLowerCase();
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
    const resources = await Promise.all([this.localizationSvc.getResource('category.title')
      , this.localizationSvc.getResource('category.name')
      , this.localizationSvc.getResource('category.groupName')]);

    const catNameTitle = resources[0];
    const alert = await this.alertCtrl.create({
      header: catNameTitle,
      inputs: [
        {
          name: 'groupName',
          type: 'text',
          placeholder: resources[1]
        },
        {
          name: 'categoryName',
          type: 'text',
          placeholder: resources[2]
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
            if(!data.categoryName && !data.groupName) {
              return;
            }

            if(!data.categoryName.trim().length && !data.groupName.trim().length) {
              return;
            }

            await this.categorySvc.put({
              name: data.categoryName,
              groupName: data.groupName,
            });   

            await this._getCategories();
          }
        }
      ]
    });

    await alert.present();
  }

}

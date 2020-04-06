import { Component, OnInit, Input } from '@angular/core';
import { AlertController, ModalController, PopoverController } from '@ionic/angular';

import { CategoryService } from './category.service';
import { AppConstant } from '../shared/app-constant';
import { ICategory } from './category.model';
import { BasePage } from '../shared/base.page';
import { SyncConstant } from '../shared/sync/sync-constant';
import { SyncEntity } from '../shared/sync/sync.model';
import { CategoryOptionsPopover } from './category-option.popover';

@Component({
  selector: 'page-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage extends BasePage implements OnInit {
  @Input() isOpenedAsModal;

  categories: ICategory[] = [];
  gorupedItems: Map<string, ICategory[]>;

  private _orignalCategories: ICategory[] = [];

  constructor(private alertCtrl: AlertController, private modalCtrl: ModalController
    , private popoverCtrl: PopoverController
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
      await this._presentAddOrUpdateModal();
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

  async onMoreOptionsButtonClicked(ev: CustomEvent, category: ICategory) {
    ev.stopImmediatePropagation();

    const popover = await this.popoverCtrl.create({
      component: CategoryOptionsPopover,
      event: ev,
      backdropDismiss: true
    });
    await popover.present();
    const { data } = await popover.onDidDismiss();
    if(data == 'edit') {
      await this._presentAddOrUpdateModal(category);
    } else if(data == 'delete') {
      const res = await this.helperSvc.presentConfirmDialog();
      if(res) {
        category.markedForDelete = true;
        category.updatedOn = null;

        await this.categorySvc.putLocal(category);  

        this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Category);
        await this._getCategories();
      }
    }
  }

  private async _getCategories(categoryList?) {
    if(!categoryList) {
      this._orignalCategories = await this.categorySvc.getCategoryListLocal();
      this.categories = this._orignalCategories;
    } else {
      this.categories = categoryList;
    }

    this.gorupedItems = this.categories.groupBy<ICategory>(c => c.groupName);
    if(AppConstant.DEBUG) {
      console.log('CategoryPage: ngOnInit: gorupedItems', this.gorupedItems);
    }
  }

  private async _presentAddOrUpdateModal(category?: ICategory) {
    const resources = await Promise.all([this.localizationSvc.getResource('category.title')
      , this.localizationSvc.getResource('category.name')
      , this.localizationSvc.getResource('category.groupName')
      , this.localizationSvc.getResource('category.icon')]);

    const catNameTitle = resources[0];
    const alert = await this.alertCtrl.create({
      header: catNameTitle,
      inputs: [
        {
          name: 'categoryName',
          type: 'text',
          value: category?.name,
          placeholder: resources[1]
        },
        {
          name: 'groupName',
          type: 'text',
          value: category?.groupName,
          placeholder: resources[2]
        },
        {
          name: 'icon',
          type: 'text',
          value: category?.icon,
          placeholder: resources[3]
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

            if(!data.categoryName.trim().length 
              || !data.groupName.trim().length
              || !data.icon.trim().length) {
              return;
            }

            const cat: ICategory = {
              name: data.categoryName,
              groupName: data.groupName,
              icon: data.icon
            };
            if(category) {
              cat.id = category.id;
              cat.markedForUpdate = true;
              category.updatedOn = null;
            }
            await this.categorySvc.putLocal(cat);   

            this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Category);
            await this._getCategories();
          }
        }
      ]
    });

    await alert.present();
  }

}

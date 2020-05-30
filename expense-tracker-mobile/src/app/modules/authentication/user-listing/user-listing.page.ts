import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PopoverController, AlertController } from '@ionic/angular';

import { BasePage } from '../../shared/base.page';
import { UserService } from '../user.service';
import { IUser, UserStatus, LoginType } from '../user.model';
import { AppConstant } from '../../shared/app-constant';
import { UserListingOptionComponent } from './user-listing-option';

@Component({
  selector: 'page-user-listing',
  templateUrl: './user-listing.page.html',
  styleUrls: ['./user-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserListingPage extends BasePage implements OnInit {

  users: IUser[];
  UserStatus = UserStatus;
  LoginType = LoginType;

  constructor(private popoverCtrl: PopoverController, private alertCtrl: AlertController
    , private userSvc: UserService) { 
    super();
  }

  async ngOnInit() {
    this.users = await this.userSvc.getAll();
    if(AppConstant.DEBUG) {
      console.log('UserListingPage: ngOnInit: users', this.users);
    }
  }

  async onMoreOptionsClicked(ev, user: IUser) {
    const popOver = await this.popoverCtrl.create({
      component: UserListingOptionComponent,
      event: ev,
      componentProps: {
        user: user
      }
    });
    await popOver.present();

    const { data } = await popOver.onDidDismiss();
    if(data) {
      switch(data) {
        case 'update':
          await this.router.navigate(['/user/user-edit', {
            email: user.email
          }]);
        break;
        case 'change_password':
          const resources = await Promise.all([
            this.localizationSvc.getResource('user.change_password')
            , this.localizationSvc.getResource('user.password')
            , this.localizationSvc.getResource('common.ok')
            , this.localizationSvc.getResource('common.cancel')
          ]);
          
          const title = resources[0];
          const alert = await this.alertCtrl.create({
            header: title,
            inputs: [
              {
                name: 'newPassword',
                type: 'text',
                placeholder: resources[1]
              }
            ],
            buttons: [
              {
                text: resources[3], 
                role: 'cancel',
                cssClass: 'secondary',
                // handler: () => {
                // }
              }, {
                text: resources[2], 
                handler: async (data) => {
                  if(!data.newPassword) {
                    return;
                  }
      
                  if(!data.newPassword.trim().length) {
                    return;
                  }
      
                  const updated = await this.userSvc.changePassword(user.email, data.newPassword.trim());
                  if(!updated) {
                    await this.helperSvc.presentToastGenericError();
                  } else {
                    await this.helperSvc.presentToastGenericSuccess();
                  }
                }
              }
            ]
          });
          await alert.present();
        break;
      }
    }
  }

}

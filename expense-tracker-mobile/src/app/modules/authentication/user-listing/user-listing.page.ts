import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { BasePage } from '../../shared/base.page';
import { UserService } from '../user.service';
import { IUser, UserStatus } from '../user.model';
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

  constructor(private popoverCtrl: PopoverController
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
      }
    }
  }

}

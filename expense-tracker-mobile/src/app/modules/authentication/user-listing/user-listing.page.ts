import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { UserService } from '../user.service';
import { IUser, UserStatus } from '../user.model';
import { AppConstant } from '../../shared/app-constant';

@Component({
  selector: 'page-user-listing',
  templateUrl: './user-listing.page.html',
  styleUrls: ['./user-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserListingPage extends BasePage implements OnInit {

  users: IUser[];
  UserStatus = UserStatus;

  constructor(private userSvc: UserService) { 
    super();
  }

  async ngOnInit() {
    this.users = await this.userSvc.getAll();
    if(AppConstant.DEBUG) {
      console.log('UserListingPage: ngOnInit: users', this.users);
    }
  }

}

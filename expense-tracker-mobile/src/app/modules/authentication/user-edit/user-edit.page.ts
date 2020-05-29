import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { ActivatedRoute } from '@angular/router';
import { AppConstant } from '../../shared/app-constant';
import { Subscription } from 'rxjs';
import { IUser } from '../user.model';
import { UserService } from '../user.service';

@Component({
  selector: 'page-user-edit',
  templateUrl: './user-edit.page.html',
  styleUrls: ['./user-edit.page.scss'],
  encapsulation: ViewEncapsulation.None 
})
export class UserEditPage extends BasePage implements OnInit, OnDestroy {
  user: IUser;

  private _routeParamsSub: Subscription;

  constructor(private activatedRoute: ActivatedRoute
    , private userSvc: UserService) {
    super();
  }

  ngOnInit() {
    this._routeParamsSub = this.activatedRoute.params.subscribe(async (params) => {
      if(AppConstant.DEBUG) {
        console.log('UserEditPage: ngOnInit: params', params);
      }
      const { email } = params;
      this.user = await this.userSvc.getByEmail(email);
      if(AppConstant.DEBUG) {
        console.log('UserEditPage: ngOnInit: user', this.user);
      }
    });
  }

  ngOnDestroy() {
    if(this._routeParamsSub) {
      this._routeParamsSub.unsubscribe();
    }
  }
}

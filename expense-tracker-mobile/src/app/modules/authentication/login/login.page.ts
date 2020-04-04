import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';

import { LoginType, ILoginParams, IUser, IUserProfile } from '../authentication.model';
import { UserSettingService } from '../user-setting.service';
import { UserConstant } from '../user-constant';
import { BasePage } from '../../shared/base.page';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { AuthenticationService } from '../authentication.service';
import { Subscription } from 'rxjs';
import { AppConstant } from '../../shared/app-constant';

@Component({
  selector: 'page-auth-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginPage extends BasePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gSigninButton') gSigninButton: ElementRef;

  //used in BackButtonDisableService
  canDeactivate = false;

  private _userLoggedInSub: Subscription;
  constructor(private authSvc: AuthenticationService
    , private userSettingSvc: UserSettingService) { 
      super();
    }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    // await this.authSvc.initGoogleAuth(this.gSigninButton.nativeElement);
  }

  async onLoginClicked(type) {
    const profile = await this.authSvc.login(type);
    if(profile) {
      this.canDeactivate = true;

      this.eventPub.$pub(UserConstant.EVENT_USER_LOGGEDIN, { 
        user: profile, 
        redirectToHome: true,
        pull: true
      });
    }
  }

  ngOnDestroy() {
    if(this._userLoggedInSub) {
      this._userLoggedInSub.unsubscribe();
    }
  }

}

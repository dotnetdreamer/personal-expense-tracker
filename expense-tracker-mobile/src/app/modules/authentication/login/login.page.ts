import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';

import { LoginType, ILoginParams, IUser } from '../authentication.model';
import { AuthenticationGoogleService } from '../authentication-google.service';
import { UserSettingService } from '../user-setting.service';
import { EventPublisher } from '../../shared/event-publisher';
import { UserConstant } from '../user-constant';
import { BasePage } from '../../shared/base.page';
import { SyncConstant } from '../../shared/sync/sync-constant';

@Component({
  selector: 'page-user-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginPage extends BasePage implements OnInit, AfterViewInit {
  @ViewChild('gSigninButton') gSigninButton: ElementRef;

  constructor(private gAuthService: AuthenticationGoogleService
    , private userSettingSvc: UserSettingService) { 
      super();
    }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    this.gAuthService.init(this.gSigninButton.nativeElement
      , async (gUserProfile) => {
        const loader = await this.helperSvc.loader;
        await loader.present();

        await this._handleLoginResponse({ 
          loginType: LoginType.GOOGLE, 
          user: gUserProfile 
        }, loader);
      }, async (e) => {
        console.log(e);
      });
  }
  
  private async _handleLoginResponse(args: ILoginParams, loader?: HTMLIonLoadingElement) {
    const promises = [];

    let profilePromise = this.gAuthService.putUserProfileLocal(args.user);
    promises.push(profilePromise);

    let loginTypePromise = this.userSettingSvc.putLoggedInMethod(args.loginType);
    promises.push(loginTypePromise);

    if(args.loginType == LoginType.STANDARD) {
      let currentUserPromise = this.userSettingSvc.putCurrentUser(args.email);
      promises.push(currentUserPromise);

      //TODO: need to remvoe storing password
      let passwordPromise =  this.userSettingSvc.putCurrentUserPassword(args.password);
      promises.push(passwordPromise);
    } else {
      let currentUserPromise = this.userSettingSvc.putCurrentUser(args.user.email);
      promises.push(currentUserPromise);
    }

    try {
      await Promise.all(promises);

      //fire the user loggedin event
      const profile = this.gAuthService.setUserDefaults(args.user);
      this.eventPub.$pub(UserConstant.EVENT_USER_LOGGEDIN, profile);

      await this.navigateToHome();

      //sync
      try {
        //first sync then pull
        // await this.syncHelperSvc.push();
        this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PULL);
      } catch (e) {
        //ignore
      }

    } catch(e) {
      throw e;
    } finally {
      if(loader) {
        await loader.dismiss();
      }
    }
  }
}

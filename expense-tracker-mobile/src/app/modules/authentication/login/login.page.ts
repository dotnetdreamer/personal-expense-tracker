import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { LoginType, ILoginParams, IUser } from '../authentication.model';
import { AuthenticationGoogleService } from '../authentication-google.service';
import { UserSettingService } from '../user-setting.service';
import { EventPublisher } from '../../shared/event-publisher';
import { UserConstant } from '../user-constant';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, AfterViewInit {
  @ViewChild('gSigninButton') gSigninButton: ElementRef;

  constructor(private gAuthService: AuthenticationGoogleService
    , private userSettingSvc: UserSettingService
    , private eventPub: EventPublisher) { }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    this.gAuthService.init(this.gSigninButton.nativeElement
      , async (gUserProfile) => {
        await this._handleLogin({ 
          loginType: LoginType.GOOGLE, 
          user: gUserProfile 
        });
      }, (e) => {
        console.log(e);
      });
  }

  async onGoogleSigninClicked(gSigninButton) {
    // await this.googleAuthSvc.init(this.gSigninButton.nativeElement);
  }

  
  private async _handleLogin(args: ILoginParams) {
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

    await Promise.all(promises);
    
    //fire the user loggedin event
    this.eventPub.$pub(UserConstant.EVENT_USER_LOGGEDIN, args.user);
  }
}

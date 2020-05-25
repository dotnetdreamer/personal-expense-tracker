import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';

import { LoginType, ILoginParams, IUser, IUserProfile } from '../user.model';
import { UserSettingService } from '../user-setting.service';
import { UserConstant } from '../user-constant';
import { BasePage } from '../../shared/base.page';
import { UserService } from '../user.service';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

@Component({
  selector: 'page-auth-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginPage extends BasePage implements OnInit, OnDestroy {
  @ViewChild('gSigninButton') gSigninButton: ElementRef;

  loginFormGroup: FormGroup;

  // //used in BackButtonDisableService
  // canDeactivate = false;

  constructor(private formBuilder: FormBuilder
    , private authSvc: UserService) { 
      super();

      this.loginFormGroup = this.formBuilder.group({
        email: ['', Validators.required],
        password: ['', Validators.required],
      });
    }

  ngOnInit() {
  }

  get f() { return this.loginFormGroup.controls; }

  async onLoginClicked(type) {
    let args = null;
    
    switch(type) {
      case LoginType.STANDARD:
        args = { email: this.f.email.value, password: this.f.password.value };
      break;
      default:
      break;
    }
    
    const profile = await this.authSvc.login(type, args);
    if(!profile) {
      return;
    }

    this.canDeactivate = true;
    this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDIN, { 
      user: profile, 
      redirectToHome: true,
      pull: true
    });
  }

  async onRegisterClicked() { 
    this.canDeactivate = true;
    await this.navigate({ path: '/user/register' });

    this._resetDeactivate();
  }

  ngOnDestroy() {

  }

  private _resetDeactivate() {
    setTimeout(() => {
      this.canDeactivate = false;
    });
  }
}

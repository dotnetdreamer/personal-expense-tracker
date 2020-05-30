import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { BasePage } from '../../shared/base.page';
import { AppConstant } from '../../shared/app-constant';
import { Subscription } from 'rxjs';
import { IUser, UserStatus, UserRole } from '../user.model';
import { UserService } from '../user.service';

@Component({
  selector: 'page-user-edit',
  templateUrl: './user-edit.page.html',
  styleUrls: ['./user-edit.page.scss'],
  encapsulation: ViewEncapsulation.None 
})
export class UserEditPage extends BasePage implements OnInit, OnDestroy {
  user: IUser;
  formGroup: FormGroup;
  UserStatus = UserStatus
  UserRole = UserRole;
  title: string;

  private _routeParamsSub: Subscription;

  constructor(private activatedRoute: ActivatedRoute
    , private formBuilder: FormBuilder, private location: Location
    , private userSvc: UserService) {
    super();

    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }, Validators.compose([Validators.required, Validators.email])],
      status: ['', Validators.required],
      role: ['', Validators.required],
      mobile:['']
    });
  }

  ngOnInit() {
    this._routeParamsSub = this.activatedRoute.params.subscribe(async (params) => {
      if(AppConstant.DEBUG) {
        console.log('UserEditPage: ngOnInit: params', params);
      }
      const { email } = params;
      
      try {
        this.user = await this.userSvc.getUserByEmailWithExternalAuth(email);
        if(AppConstant.DEBUG) {
          console.log('UserEditPage: ngOnInit: user', this.user);
        }

        if(!this.user) {
          await this.helperSvc.presentToastGenericError();
          return;
        }

        this.title = this.user.name;
        this.f.name.setValue(this.user.name);
        this.f.email.setValue(this.user.email);
        if(this.user.mobile) {
          this.f.mobile.setValue(this.user.mobile);
        }
        this.f.status.setValue(this.user.status);
        this.f.role.setValue(this.user.role);

        //disable in case of external auth
        if(this.user.externalAuth) {
          this.f.name.disable();
          this.f.mobile.disable();
        }
      } catch(e) {
        //
      }
    });
  }

  get f() { return this.formGroup.controls; }

  async onFormSubmit(args) {
    const loader = await this.helperSvc.loader;
    await loader.present();

    try {
      const data = await this.userSvc.update({
        email: args.email,
        mobile: args.mobile,
        name: args.name,
        status: args.status,
        role: args.role
      });
      if(AppConstant.DEBUG) {
        console.log('RegisterPage: onFormSubmit: data', data);
      }
  
      if(!data) {
        await this.helperSvc.presentToastGenericError();
        return;
      }

      await this.helperSvc.presentToastGenericSuccess();
      this.location.back();
    } catch(e) {
      ///
    } finally {
      await loader.dismiss();
    }

    // if(response.status != 200) {
    //   await this.helperSvc.presentToast(response.message, false);
    //   return;
    // }

    // await this.helperSvc.presentInfoDialog(response.message);
    // await this.router.navigate(['/home'], { replaceUrl: true });
  }

  ngOnDestroy() {
    if(this._routeParamsSub) {
      this._routeParamsSub.unsubscribe();
    }
  }
}

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';

import { EtValidators } from '../../shared/et.validators';
import { BasePage } from '../../shared/base.page';
import { UserService } from '../user.service';
import { AppConstant } from '../../shared/app-constant';

@Component({
  selector: 'page-auth-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterPage extends BasePage implements OnInit {
  registrationFormGroup: FormGroup;

  constructor(private formBuilder: FormBuilder
    , private authSvc: UserService, private location: Location) { 
    super();
    this.registrationFormGroup = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      mobile:['']
    });

    this.registrationFormGroup.setValidators([EtValidators.ValidateConfirmPassword]);
  }

  ngOnInit() {
    if(AppConstant.DEBUG) {
      this._prefill();
    }
  }

  get f() { return this.registrationFormGroup.controls; }

  async onRegisterationFormSubmit(args) {
    const loader = await this.helperSvc.loader;
    await loader.present();

    try {
      const response = await this.authSvc.register({
        email: args.email,
        mobile: args.mobile,
        name: args.name,
        password: args.password
      });
      if(AppConstant.DEBUG) {
        console.log('RegisterPage: response', response);
      }
  
      if(!response.data) {
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

  private _prefill() {
    const rand = this.helperSvc.getRandomNumber();
    
    this.f.name.setValue(`${rand}`);
    this.f.email.setValue(`${rand}@example.com`);
    this.f.mobile.setValue(`${rand}`);
    this.f.password.setValue(`password`);
    this.f.confirmPassword.setValue(`password`);
  }
}


import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { EtValidators } from '../../shared/et.validators';
import { BasePage } from '../../shared/base.page';
import { AuthenticationService } from '../authentication.service';

@Component({
  selector: 'page-auth-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterPage extends BasePage implements OnInit {
  registratioFormGroup: FormGroup;

  constructor(private formBuilder: FormBuilder
    , private authSvc: AuthenticationService) { 
    super();
    this.registratioFormGroup = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      mobile:['']
    });

    this.registratioFormGroup.setValidators([EtValidators.ValidateConfirmPassword]);
  }

  ngOnInit() {
  }

  get f() { return this.registratioFormGroup.controls; }


  async onRegisterationFormSubmit(args) {
    // const response = await this.authSvc.register({
    //   email: args.email,
    //   mobile: args.mobile,
    //   name: args.name,
    //   password: args.password,
    //   confirmPassword: args.confirmPassword
    // });

    // if(response.status != 200) {
    //   await this.helperSvc.presentToast(response.message, false);
    //   return;
    // }

    // await this.helperSvc.presentInfoDialog(response.message);
    // await this.router.navigate(['/home'], { replaceUrl: true });
  }
}

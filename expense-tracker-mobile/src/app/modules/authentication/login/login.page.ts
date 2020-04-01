import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { AuthenticationGoogleService } from '../authentication-google.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, AfterViewInit {
  @ViewChild('gSigninButton') gSigninButton: ElementRef;

  constructor(private googleAuthSvc: AuthenticationGoogleService) { }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    this.googleAuthSvc.init(this.gSigninButton.nativeElement
      , (gUserProfile) => {

        console.log(gUserProfile);

    //   document.getElementById('name').innerText = "Signed in: " + googleUser.getBasicProfile().getName();
      }, (e: { error: 'popup_closed_by_user' }) => {
        console.log(e);
      });
  }

  async onGoogleSigninClicked(gSigninButton) {
    // await this.googleAuthSvc.init(this.gSigninButton.nativeElement);
  }

}

import { Component, ViewEncapsulation } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppSettingService } from './modules/shared/app-setting.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'List',
      url: '/list',
      icon: 'list'
    }
  ];

  constructor( private router: Router
    , private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
    , private appSettingSvc: AppSettingService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      this.statusBar.styleDefault();

      const wk = await this.appSettingSvc.getWorkingLanguage();

      await this.appSettingSvc.putWorkingLanguage('en');

      // await this._navigateTo('/expense/expense-create-or-update');
      await this._navigateTo('/expense/expense-listing');
      this.splashScreen.hide();
    });
  }

  private async subscribeEvents() {
  }

  private async _navigateTo(path, args?, replaceUrl = false) {
    if(!args) {
      await this.router.navigate([path], { replaceUrl: replaceUrl });
    } else {
      await this.router.navigate([path, args], { replaceUrl: replaceUrl });
    }
  }
}

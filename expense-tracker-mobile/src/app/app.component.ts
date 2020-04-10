import { Component, ViewEncapsulation, Renderer2, Inject } from '@angular/core';

import { Plugins } from '@capacitor/core';
const { SplashScreen, StatusBar, Device } = Plugins;
import { Platform } from '@ionic/angular';
import { Subscription, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { AppSettingService } from './modules/shared/app-setting.service';
import { Router } from '@angular/router';
import { CategoryService } from './modules/category/category.service';
import { SyncHelperService } from './modules/shared/sync/sync-helper.service';
import { SyncConstant } from './modules/shared/sync/sync-constant';
import { AppConstant } from './modules/shared/app-constant';
import { DOCUMENT } from '@angular/common';
import { HelperService } from './modules/shared/helper.service';
import { CurrencySettingService } from './modules/currency/currency-setting.service';
import { CurrencyConstant } from './modules/currency/currency-constant';
import { CheckForUpdateService } from './modules/shared/update-service';
import { UserConstant } from './modules/authentication/user-constant';
import { IUser, IUserProfile, LoginType } from './modules/authentication/authentication.model';
import { AuthenticationService } from './modules/authentication/authentication.service';
import { UserSettingService } from './modules/authentication/user-setting.service';
import { NgxPubSubService } from '@pscoped/ngx-pub-sub';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  workingLanguage;
  appVersion;
  currentUser: IUserProfile;

  constructor( private router: Router, @Inject(DOCUMENT) private document: Document
  , private renderer: Renderer2, private platform: Platform
    , private pubsubSvc: NgxPubSubService, private checkforUpdateSvc: CheckForUpdateService
    , protected currencySettingSvc: CurrencySettingService
    , private appSettingSvc: AppSettingService, private syncHelperSvc: SyncHelperService
    , private categorySvc: CategoryService, private helperSvc: HelperService
    , private authSvc: AuthenticationService, private userSettingSvc: UserSettingService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this._subscribeToEvents();

    this.platform.ready().then(async () => {
      // StatusBar.styleDefault();
    });
  }

  onAddGroupClicked(ev: CustomEvent) {
    ev.stopImmediatePropagation();
    ev.stopPropagation();
  }

  async onItemClicked(url, timeout?) {
    setTimeout(async () => {
      switch(url) {
        case '/home':
          //clear all history
          this.router.navigate([url], { replaceUrl: true });
        break;
        case '/logout':
          await this._logout();
        break;
        default:
          this.router.navigate([url]);
        break;
      }
    }, typeof timeout !== 'undefined' ? timeout : 300);
  }

  private async _subscribeToEvents() {
    this.pubsubSvc.subscribe(AppConstant.EVENT_DB_INITIALIZED, async () => {
      if(AppConstant.DEBUG) {
          console.log('Event received: EVENT_DB_INITIALIZED');
      }

      await this._setDefaults();
    });

    this.pubsubSvc.subscribe(AppConstant.EVENT_LANGUAGE_CHANGED, async (params) => {
      if(AppConstant.DEBUG) {
        console.log('EVENT_LANGUAGE_CHANGED', params);
      }
      const { wkLangauge, reload } = params;
      if(reload) {
        SplashScreen.show();

        // make sure we are in root page before reoloading, just incase if user tries to change the language from inner page
        await this._navigateTo('/home', true);
        setTimeout(() => {
          this.document.location.reload(true);
        });
      } else {
        this.document.documentElement.dir = wkLangauge == 'en' ? 'ltr' : 'rtl';   
        this.workingLanguage = wkLangauge;
        
        setTimeout(() => {
          this.renderer.addClass(document.body, wkLangauge);
        });
      }
    });

    this.pubsubSvc.subscribe(CurrencyConstant.EVENT_CURRENCY_CHANGED, async (params) => {
      if(AppConstant.DEBUG) {
        console.log('EVENT_CURRENCY_CHANGED', params);
      }
      const { wkCurrency, reload } = params;
      if(reload) {
        SplashScreen.show();

        // make sure we are in root page before reoloading, just incase if user tries to change the language from inner page
        await this._navigateTo('/home', true);
        setTimeout(() => {
          this.document.location.reload(true);
        });
      }
    });

    
    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH, async (table?) => {
      if(AppConstant.DEBUG) {
        console.log('HomePage: EVENT_SYNC_DATA_PUSH: table:', table);
      }
      await this.syncHelperSvc.push(table);
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL, async (table?) => {
      if(AppConstant.DEBUG) {
        console.log('HomePage: EVENT_SYNC_DATA_PULL: table:', table);
      }
      try {
        await this.syncHelperSvc.pull(table);
      } catch(e) {
        //ignore...
      }
    });

    this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent:Event received: EVENT_SYNC_DATA_PULL_COMPLETE');
      }

      const { appVersion } = await (await Device.getInfo());
      this.appVersion = appVersion;

      try {
        SplashScreen.hide();
      } catch(e) { }
    });

    this.pubsubSvc.subscribe(UserConstant.EVENT_USER_LOGGEDIN
      , async (params: { user: IUserProfile, redirectToHome: boolean, pull: boolean }) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_USER_LOGGEDIN: params', params);
      }

      this.currentUser = params.user;
      if(params.redirectToHome) {
        await this._navigateTo('/home', null, true);
      }

      //sync
      if(params.pull) {
        try {
          //first sync then pull
          // await this.syncHelperSvc.push();
          this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL);
        } catch (e) {
          //ignore
        }
      }
    });
    
    this.pubsubSvc.subscribe(UserConstant.EVENT_USER_LOGGEDOUT, async (args) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_USER_LOGGEDOUT: args', args);
      }
      this.currentUser = null;

      //redirect to login...
      await this._navigateTo('/authentication/login', null, true);
    });

    //EVENT_SYNC_DATA_PUSH_COMPLETE is fired by multiple sources, we debounce subscription to execute this once
    const obv = new Observable(observer => {
      //next will call the observable and pass parameter to subscription
      const callback = (params) => observer.next(params);
      const subc = this.pubsubSvc.subscribe(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, callback);
      //will be called when unsubscribe calls
      return () => subc.unsubscribe()
    }).pipe(debounceTime(500))
      .subscribe((totalTables) => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent: EVENT_SYNC_DATA_PUSH_COMPLETE: totalTables', totalTables);
      }
    });
  }

  private async _logout() {
    const resp = await this.helperSvc.presentConfirmDialog();
    if(resp) {
      const loader = await this.helperSvc.loader;
      await loader.dismiss();

      try {
        await this.authSvc.logout();
      } catch(e) {

      } finally {
        await loader.dismiss();
      }
    }
  }

  private async _setDefaults() {
    const res = await Promise.all([
      this.userSettingSvc.getUserProfileLocal()
      , this.appSettingSvc.getWorkingLanguage(), this.currencySettingSvc.getWorkingCurrency()
    ]);

    let wkl = res[1];
    if(!wkl) {
      wkl = 'en';
      await this.appSettingSvc.putWorkingLanguage(wkl);
    }
    this.pubsubSvc.publishEvent(AppConstant.EVENT_LANGUAGE_CHANGED, { wkLangauge: wkl, reload: false });
    this.workingLanguage = wkl;

    let wkc = await res[2];
    if(!wkc) {
      wkc = 'AED';
      await this.currencySettingSvc.putWorkingCurrency(wkc);
    }
    this.pubsubSvc.publishEvent(CurrencyConstant.EVENT_CURRENCY_CHANGED, { wkCurrency: wkc, reload: false });

    //user
    const cUser = res[0];
    if(cUser) {
      this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDIN, { user: cUser });
      await this._navigateTo('/home');

      if(AppConstant.DEBUG) {
        console.log('AppComponent: _setDefaults: publishing EVENT_SYNC_DATA_PULL');
      }
      this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PULL);
    } else {
      await this._navigateTo('/authentication/login');
    }

    // await this._navigateTo('/expense/expense-create-or-update');
    // await this._navigateTo('/expense/expense-listing');
    // await this._navigateTo('/category');
    // await this._navigateTo('/home');
  }

  private async _navigateTo(path, args?, replaceUrl = false) {
    if(!args) {
      await this.router.navigate([path], { replaceUrl: replaceUrl });
    } else {
      await this.router.navigate([path, args], { replaceUrl: replaceUrl });
    }
  }
}

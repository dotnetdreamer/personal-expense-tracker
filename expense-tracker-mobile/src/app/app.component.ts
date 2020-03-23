import { Component, ViewEncapsulation, Renderer2, Inject } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppSettingService } from './modules/shared/app-setting.service';
import { Router } from '@angular/router';
import { CategoryService } from './modules/category/category.service';
import { EventPublisher } from './modules/shared/event-publisher';
import { SyncHelperService } from './modules/shared/sync/sync-helper.service';
import { SyncConstant } from './modules/shared/sync/sync-constant';
import { AppConstant } from './modules/shared/app-constant';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  workingLanguage;

  constructor( private router: Router, @Inject(DOCUMENT) private document: Document
  , private renderer: Renderer2, private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
    , private eventPub: EventPublisher
    , private appSettingSvc: AppSettingService, private syncHelperSvc: SyncHelperService
    , private categorySvc: CategoryService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this._subscribeToEvents();

    this.platform.ready().then(async () => {
      this.statusBar.styleDefault();
    });
  }

  private async _subscribeToEvents() {
    this.eventPub.$sub(AppConstant.EVENT_DB_INITIALIZED, async () => {
      if(AppConstant.DEBUG) {
          console.log('Event received: EVENT_DB_INITIALIZED');
      }

      let wk = await this.appSettingSvc.getWorkingLanguage();
      if(!wk) {
        wk = 'en';
        await this.appSettingSvc.putWorkingLanguage(wk);
      }
      this.eventPub.$pub(AppConstant.EVENT_LANGUAGE_CHANGED, { wkLangauge: wk, reload: false });
      this.workingLanguage = wk;

      //populate categories
      await this.categorySvc.populate();

      try {
        //sync
        await this.syncHelperSvc.pull();
      } catch (e) {
        //ignore
      }

      // await this._navigateTo('/expense/expense-create-or-update');
      // await this._navigateTo('/expense/expense-listing');
      // await this._navigateTo('/category');
      await this._navigateTo('/home');
    });
    this.eventPub.$sub(AppConstant.EVENT_LANGUAGE_CHANGED, async (params) => {
      if(AppConstant.DEBUG) {
        console.log('EVENT_LANGUAGE_CHANGED', params);
      }
      const { wkLangauge, reload } = params;
      if(reload) {
        this.splashScreen.show();
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

    this.eventPub.$sub(SyncConstant.EVENT_SYNC_DATA_PUSH, async (table?) => {
      if(AppConstant.DEBUG) {
        console.log('HomePage: EVENT_SYNC_DATA_PUSH: table:', table);
      }
      await this.syncHelperSvc.push(table);
    });

    this.eventPub.$sub(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, async (totalTables) => {
      if(AppConstant.DEBUG) {
        console.log('HomePage: EVENT_SYNC_DATA_PUSH_COMPLETE: totalTables', totalTables);
      }
      // setTimeout(() => {
      //   this.isSyncing = false;
      // }, 1000);
    });

    this.eventPub.$sub(AppConstant.EVENT_SYNC_INIT_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('AppComponent:Event received: EVENT_SYNC_INIT_COMPLETE');
      }
      try {
        this.splashScreen.hide();
      } catch(e) { }
    });
  }

  private async _navigateTo(path, args?, replaceUrl = false) {
    if(!args) {
      await this.router.navigate([path], { replaceUrl: replaceUrl });
    } else {
      await this.router.navigate([path, args], { replaceUrl: replaceUrl });
    }
  }
}

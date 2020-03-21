import { Component, ViewEncapsulation } from '@angular/core';

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

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  constructor( private router: Router
    , private platform: Platform,
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

      const wk = await this.appSettingSvc.getWorkingLanguage();
      if(!wk) {
        await this.appSettingSvc.putWorkingLanguage('en');
        //populate categories
        await this.categorySvc.populate();

        //sync
        await this.syncHelperSvc.pull();
      }


      // await this._navigateTo('/expense/expense-create-or-update');
      // await this._navigateTo('/expense/expense-listing');
      // await this._navigateTo('/category');
      await this._navigateTo('/home');
    });
  }

  private async _subscribeToEvents() {
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

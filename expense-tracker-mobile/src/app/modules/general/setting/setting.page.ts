import { Component, OnInit, ViewEncapsulation, Inject, OnDestroy } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { DbService } from '../../shared/db/db-base.service';
import { AppInjector } from '../../shared/app-injector';
import { Platform } from '@ionic/angular';
import { DbSqlService } from '../../shared/db/db-sql.service';
import { DbWebService } from '../../shared/db/db-web.service';
import { DOCUMENT } from '@angular/common';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { Subscription } from 'rxjs';
import { AppConstant } from '../../shared/app-constant';

@Component({
  selector: 'page-general-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingPage extends BasePage implements OnInit, OnDestroy {
  dbService: DbService;
  isSyncInProgress = false;

  private _syncDataPushCompleteSub: Subscription;
  constructor(private platform: Platform, @Inject(DOCUMENT) private document: Document) { 
    super();

    this._subscribeToEvents();
    const injector = AppInjector.getInjector();
    // if(this.platform.is('cordova')) {
    //   this.dbService = injector.get(DbSqlService);
    // } else {
      this.dbService = injector.get(DbWebService);
    // }
  }

  ngOnInit() {
  }

  async onSyncButtonClicked() {
    this.isSyncInProgress = true;
    this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH);
  }

  async onDeleteDbClickec() {
    const res = await this.helperSvc.presentConfirmDialog();
    if(res) {
      await this.dbService.delete();

      await this.navigateToHome();
      this.document.location.reload(true);
    }
  }

  async ngOnDestroy() {
    if(this._syncDataPushCompleteSub) {
      this._syncDataPushCompleteSub.unsubscribe();
    }
  }

  private _subscribeToEvents() {
    this._syncDataPushCompleteSub = this.eventPub.$sub(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, async () => {
      if(AppConstant.DEBUG) {
        console.log('SettingPage:Event received: EVENT_SYNC_DATA_PUSH_COMPLETE');
      }
      setTimeout(async () => {
        this.isSyncInProgress = false;
      });
    });
  }
}

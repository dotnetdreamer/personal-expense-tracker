import { Component, OnInit, ViewEncapsulation, Inject, OnDestroy, ViewChild } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { DbService } from '../../shared/db/db-base.service';
import { AppInjector } from '../../shared/app-injector';
import { Platform, IonTextarea } from '@ionic/angular';
import { DbSqlService } from '../../shared/db/db-sql.service';
import { DbWebService } from '../../shared/db/db-web.service';
import { DOCUMENT } from '@angular/common';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { Subscription } from 'rxjs';
import { AppConstant } from '../../shared/app-constant';
import { SchemaService } from '../../shared/db/schema.service';

@Component({
  selector: 'page-general-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingPage extends BasePage implements OnInit, OnDestroy {
  @ViewChild('tableDataTextArea') tableDataTextArea: IonTextarea;

  dbSvc: DbService;
  schemaSvc: SchemaService;

  isSyncInProgress = false;
  selectedTable;
  tables: string[] = [];

  private _syncDataPushCompleteSub: Subscription;
  constructor(private platform: Platform, @Inject(DOCUMENT) private document: Document) { 
    super();

    this._subscribeToEvents();
    const injector = AppInjector.getInjector();
    // if(this.platform.is('cordova')) {
    //   this.dbService = injector.get(DbSqlService);
    // } else {
      this.dbSvc = injector.get(DbWebService);
    // }
    this.schemaSvc = injector.get(SchemaService);
  }

  ngOnInit() {
    for(let tab in this.schemaSvc.tables) {
      this.tables.push(this.schemaSvc.tables[tab]);
    }
  }

  async onTableSelectionChanged() {
    const data = await this.dbSvc.getAll<any[]>(this.selectedTable);
    if(!data) {
      this.tableDataTextArea.value = '';
    } else {
      this.tableDataTextArea.value = JSON.stringify(data);
    }
  }

  async onTableActionClicked(action: 'update' | 'reset') {
    if(action == 'update') {
      const res = await this.helperSvc.presentConfirmDialog();
      if(!res) {
        return;
      }

      try {
        let data = this.tableDataTextArea.value;
        if(data && data.length) {
          data = JSON.parse(this.tableDataTextArea.value);

          //remove all first
          await this.dbSvc.removeAll(this.selectedTable);
          //now update it...
          await this.dbSvc.putLocal(this.selectedTable, data);
        } else {
          //remove it...
          await this.dbSvc.removeAll(this.selectedTable);
        }
      } catch (e) {
        await this.helperSvc.presentToast(e, false);
      }
    } else if(action == 'reset') {
      this.tableDataTextArea.value = null;

      setTimeout(async () => {
        await this.onTableSelectionChanged();
      });
    }
  }

  async onSyncButtonClicked() {
    this.isSyncInProgress = true;
    this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH);
  }

  async onDeleteDbClickec() {
    const res = await this.helperSvc.presentConfirmDialog();
    if(res) {
      await this.dbSvc.delete();

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

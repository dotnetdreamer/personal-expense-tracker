import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { DbService } from '../../shared/db/db-base.service';
import { AppInjector } from '../../shared/app-injector';
import { Platform } from '@ionic/angular';
import { DbSqlService } from '../../shared/db/db-sql.service';
import { DbWebService } from '../../shared/db/db-web.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'page-general-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingPage extends BasePage implements OnInit {
  protected dbService: DbService;

  constructor(private platform: Platform, @Inject(DOCUMENT) private document: Document) { 
    super();

    const injector = AppInjector.getInjector();
    if(this.platform.is('cordova')) {
      this.dbService = injector.get(DbSqlService);
    } else {
      this.dbService = injector.get(DbWebService);
    }
  }

  ngOnInit() {
  }

  async onDeleteDbClickec() {
    const res = await this.helperSvc.presentConfirmDialog();
    if(res) {
      await this.dbService.delete();

      await this.navigateToHome();
      this.document.location.reload(true);
    }
  }
}

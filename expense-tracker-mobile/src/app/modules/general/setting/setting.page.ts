import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { BasePage } from '../../shared/base.page';
import { DbService } from '../../shared/db/db-base.service';
import { AppInjector } from '../../shared/app-injector';
import { Platform } from '@ionic/angular';
import { DbSqlService } from '../../shared/db/db-sql.service';
import { DbWebService } from '../../shared/db/db-web.service';

@Component({
  selector: 'page-general-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingPage extends BasePage implements OnInit {
  protected dbService: DbService;

  constructor(private platform: Platform) { 
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
      // const rtest = k
    }
  }

}

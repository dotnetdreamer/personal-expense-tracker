import { Injectable } from "@angular/core";

import { AppSettingService } from '../shared/app-setting.service';
import { CurrencyConstant } from './currency-constant';

@Injectable({
    providedIn: 'root'
})
export class CurrencySettingService extends AppSettingService {
    constructor() {
        super();
    }


    putWorkingCurrency(currency) {
        return this.dbService.putLocal(this.schemaSvc.tables.setting, {
            key: CurrencyConstant.KEY_WORKING_CURRENCY,
            value: currency
        }).then(() => {
            AppSettingService.settingCache.set(CurrencyConstant.KEY_WORKING_CURRENCY, currency);
        });
    }

    getWorkingCurrency() {
        return this.get<string>(CurrencyConstant.KEY_WORKING_CURRENCY);
    }
}
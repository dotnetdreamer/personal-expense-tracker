import { Pipe } from '@angular/core';

import { CurrencySettingService } from '../modules/currency/currency-setting.service';


@Pipe({
  name:"formateCurrency"
})
export class FormateCurrencyPipe {
    constructor(private currencySettingSvc: CurrencySettingService) {

    }

    transform(amount: number, workingCurrency?: string) {
        return new Promise(async (resolve, reject) => {
            if(!amount) {
                amount = 0;
            }
            amount = Number(amount);
            
            if(!workingCurrency) {
                workingCurrency = await this.currencySettingSvc.getWorkingCurrency();
            }

            const fc = `${amount.toFixed(2)}&nbsp;<span>${workingCurrency}</span>`;
            resolve(fc);
        });
    }
}
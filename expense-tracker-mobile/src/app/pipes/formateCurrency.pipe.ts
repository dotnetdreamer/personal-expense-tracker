import { Pipe } from '@angular/core';

import { CurrencySettingService } from '../modules/currency/currency-setting.service';


@Pipe({
  name:"formateCurrency"
})
export class FormateCurrencyPipe {
    constructor(private currencySettingSvc: CurrencySettingService) {

    }

    transform(amount, workingCurrency?: string) {
        return new Promise(async (resolve, reject) => {
            if(!amount) {
                amount = "0";
            }
            // amount = Number(amount);
            amount = amount.toString();

            if(!workingCurrency) {
                workingCurrency = await this.currencySettingSvc.getWorkingCurrency();
            }

            let amountNmbr, amountSymbol;
            if(amount.includes('+') || amount.includes('-')) {
                //take only the number i.e ignore '+' or '-'
                amountNmbr = Number(amount.substr(1, amount.length));
                amountSymbol = amount.substr(0, 1);
            } else {
                amountSymbol = '';
                amountNmbr = Number(amount);
            }
            const fc = `${amountSymbol}${amountNmbr.toFixed(2)}&nbsp;<span>${workingCurrency}</span>`;
            resolve(fc);
        });
    }
}
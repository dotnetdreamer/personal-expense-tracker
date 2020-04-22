import { Pipe } from "@angular/core";

import { IExpense } from '../modules/expense/expense.model';
import { UserSettingService } from '../modules/authentication/user-setting.service';
import { CurrencySettingService } from '../modules/currency/currency-setting.service';
import { FormateCurrencyPipe } from './formateCurrency.pipe';

@Pipe({
    name: 'expenseamount'
})
export class ExpenseAmountPipe {
    constructor(private userSettingSvc: UserSettingService
        , private formatCurrencyPipe: FormateCurrencyPipe) {

    }
    
    async transform(expense: IExpense, shouldFormat = true) {
        //if expense is in a group and have transactions, 
        //then consider grabing current user transaction as an expense
        let finalAmount;
        if(expense.group) {
            const email = await this.userSettingSvc.getCurrentUser();
            const cuTran = expense.transactions.filter(t => t.email == email)[0];
            if(cuTran) {
                const total = cuTran.credit - cuTran.debit;
                finalAmount = `${total > 0 ? '+' : ''}${total}`;
            }
        } else {
            finalAmount = `${expense.amount}`;
        }

        if(shouldFormat) {
            finalAmount = await this.formatCurrencyPipe.transform(finalAmount);
        }

        return finalAmount;
    }
}
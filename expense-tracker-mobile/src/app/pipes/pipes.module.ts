import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';
import { HighlightSearchPipe } from './highlightsearch.pipe';
import { SafePipe } from './safe.pipe';
import { ExpenseAmountPipe } from './expenseAmount.pipe';
import { FormateCurrencyPipe } from './formateCurrency.pipe';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe,
        ExpenseAmountPipe,
        FormateCurrencyPipe
    ],
    imports: [
        CommonModule
    ],
    providers: [ExpenseAmountPipe, FormateCurrencyPipe],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe,
        ExpenseAmountPipe,
        FormateCurrencyPipe
    ]
})
export class PipesModule { }
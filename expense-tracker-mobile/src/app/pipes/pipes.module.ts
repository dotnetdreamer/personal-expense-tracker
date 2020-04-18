import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';
import { HighlightSearchPipe } from './highlightsearch.pipe';
import { SafePipe } from './safe.pipe';
import { ExpenseAmountPipe } from './expenseAmount.pipe';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe,
        ExpenseAmountPipe,
    ],
    imports: [

    ],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe,
        ExpenseAmountPipe
    ]
})
export class PipesModule { }
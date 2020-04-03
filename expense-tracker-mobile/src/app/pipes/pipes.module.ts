import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';
import { HighlightSearchPipe } from './highlightsearch.pipe';
import { SafePipe } from './safe.pipe';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe
    ],
    imports: [

    ],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe,
        SafePipe
    ]
})
export class PipesModule { }
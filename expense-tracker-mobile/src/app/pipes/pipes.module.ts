import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';
import { HighlightSearchPipe } from './highlightsearch.pipe';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe
    ],
    imports: [

    ],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe,
        HighlightSearchPipe
    ]
})
export class PipesModule { }
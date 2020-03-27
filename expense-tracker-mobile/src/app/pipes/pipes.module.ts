import { NgModule } from '@angular/core';

import { LocalizedResourcePipe } from './localizedRresource.pipe';
import { FormateDatePipe } from './formateDate.pipe';

@NgModule({
    declarations: [
        LocalizedResourcePipe,
        FormateDatePipe
    ],
    imports: [

    ],
    exports: [
        LocalizedResourcePipe,
        FormateDatePipe
    ]
})
export class PipesModule { }
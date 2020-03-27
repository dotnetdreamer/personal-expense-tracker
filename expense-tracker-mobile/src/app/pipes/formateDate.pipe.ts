import { Pipe } from '@angular/core';

import * as moment from 'moment';
import { AppConstant } from '../modules/shared/app-constant';


@Pipe({
  name:"formateDate"
})
export class FormateDatePipe {
    constructor() {

    }

    transform(date: string, workingLanguage?: string) {
        return new Promise((resolve, reject) => {
            if(!date) {
                resolve();
            } else {
                const fd = moment(date).format(AppConstant.DEFAULT_DATE_FORMAT);
                resolve(fd);
            }
        });
    }
}
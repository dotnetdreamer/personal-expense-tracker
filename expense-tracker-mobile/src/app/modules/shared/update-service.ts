import { ApplicationRef, Injectable } from '@angular/core';

import { SwUpdate } from '@angular/service-worker';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';
import { AppConstant } from './app-constant';

@Injectable({
    providedIn: 'root'
})
//https://angular.io/guide/service-worker-communications
export class CheckForUpdateService {
  constructor(appRef: ApplicationRef, updates: SwUpdate) {
    // Allow the app to stabilize first, before starting polling for updates with `interval()`.
    const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(async () => {
      try {
        await updates.checkForUpdate();
      } catch (e) {
        //not supported by browser...
        // if(AppConstant.DEBUG) {
        //   throw e;
        // }
      }
    });

    updates.available.subscribe((event) => {
        // if (promptUser(event)) {
        if (confirm('Updates are available. Do you want to install it?')) {
          updates.activateUpdate().then(() => document.location.reload());
        }
    });
  }
}
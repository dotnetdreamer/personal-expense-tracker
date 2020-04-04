import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class BackButtonDisableService implements CanDeactivate<any> {

  constructor() { }

  canDeactivate(component: any, currentRoute: ActivatedRouteSnapshot
    , currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot) {
    //   console.log(currentState, nextState);
    //   console.log(component, currentRoute);
    // if(!currentRoute.data?.allowedRoutes) {
    //     return false;
    // }

    // const nextRoute = nextState.url;
    // const allowedRoutes = <string[]>currentRoute.data.allowedRoutes;

    // const path = allowedRoutes.filter(r => r.toLowerCase().includes(nextRoute.toLowerCase()));
    // if(!path.length) {
    //     return false;
    // }

    //for login only...
    if(!component.canDeactivate) {
        return false;
    }

    return true;
  }
}
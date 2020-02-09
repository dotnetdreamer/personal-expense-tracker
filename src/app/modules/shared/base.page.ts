import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import { AppInjector } from './app-injector';

@Component({
    template: 'NO UI TO BE FOUND HERE!',
})
export class BasePage {
    protected router: Router;

    constructor() {
        const injector = AppInjector.getInjector();

        this.router = injector.get(Router);
    }

    async navigate(args: { path, params?, extras?: NavigationExtras }) {
        if(args.params) {
            await this.router.navigate([args.path, args.params], args.extras)
        } else {
            await this.router.navigate([args.path], args.extras)
        }
    }

    async navigateToHome(shouldReplaceUrl = true) {
        await this.navigate({ path: '/home', extras: shouldReplaceUrl ? { replaceUrl: shouldReplaceUrl } : null });
    }
}

import { ModalController, AlertController, PopoverController } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { CanDeactivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BackButtonService implements CanDeactivate<any> {

  constructor( 
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private readonly location: Location,
    private readonly router: Router) { }

  canDeactivate(component: any, currentRoute: ActivatedRouteSnapshot): Promise<boolean> {
    return new Promise(async (resolve) => {
        const modal = await this.modalCtrl.getTop();
        if (modal) {
            await modal.dismiss();
            
            const currentUrlTree = this.router.createUrlTree([], currentRoute);
            const currentUrl = currentUrlTree.toString();
            this.location.go(currentUrl);

            resolve(false);
            return;
        }
        const alertElement = await this.alertCtrl.getTop();
        if (alertElement) {
            await alertElement.dismiss();

            const currentUrlTree = this.router.createUrlTree([], currentRoute);
            const currentUrl = currentUrlTree.toString();
            this.location.go(currentUrl);

            resolve(false);
            return;
        }
        const popoverElement = await this.popoverCtrl.getTop();
        if (popoverElement) {
            await popoverElement.dismiss();

            const currentUrlTree = this.router.createUrlTree([], currentRoute);
            const currentUrl = currentUrlTree.toString();
            this.location.go(currentUrl);

            resolve(false);
            return;
        }
        resolve(true);
    });
  }
}
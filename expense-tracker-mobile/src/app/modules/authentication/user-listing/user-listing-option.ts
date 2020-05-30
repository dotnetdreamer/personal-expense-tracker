import { Component, Input } from "@angular/core";
import { PopoverController } from '@ionic/angular';

import { IUser, UserStatus } from '../user.model';

@Component({
    selector: 'user-listing-option',
    template: `
        <ion-list>
            <ion-item detail="false" button (click)="dismiss('update')">
                <ion-label>{{'common.update' | localizedresource | async}}</ion-label>
            </ion-item>
            <ion-item detail="false" button (click)="dismiss('change_password')" *ngIf="!user?.externalAuth">
                <ion-label>{{'user.change_password' | localizedresource | async}}</ion-label>
            </ion-item>
        </ion-list>
    `
})
export class UserListingOptionComponent {
    @Input() user: IUser;
    UserStatus = UserStatus;

    constructor(private popoverCtrl: PopoverController) {

    }

    async dismiss(data?) {
        await this.popoverCtrl.dismiss(data);
    }
}
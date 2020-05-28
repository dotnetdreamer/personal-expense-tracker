import { Component, Input } from "@angular/core";
import { PopoverController } from '@ionic/angular';

import { IUser, UserStatus } from '../user.model';

@Component({
    selector: 'user-listing-option',
    template: `
        <ion-list>
            <ion-item detail="false" button (click)="dismiss('update_status')">
                <ion-label>{{'user.update_status' | localizedresource | async}}</ion-label>
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
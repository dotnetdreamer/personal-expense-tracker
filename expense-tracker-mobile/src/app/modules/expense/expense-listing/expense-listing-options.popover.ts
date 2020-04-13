import { Component, Input, OnInit } from "@angular/core";

import { PopoverController } from '@ionic/angular';

@Component({
    selector: 'expense-detail-option',
    template: `
        <ion-list>
            <ion-item (click)="dismiss('add_member')">
                <ion-icon slot="start" name="person-add"></ion-icon>
                <ion-label>{{'group.add_member' | localizedresource | async }}</ion-label>
            </ion-item>
        </ion-list>
    `,
})
export class ExpenseListingOption implements OnInit {
    constructor(private popoverCtrl: PopoverController) {

    }

    ngOnInit() {
    }

    async dismiss(opt: 'add_member') {
        await this.popoverCtrl.dismiss(opt);
    }
}
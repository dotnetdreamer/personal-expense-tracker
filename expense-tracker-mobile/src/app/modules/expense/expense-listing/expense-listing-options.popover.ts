import { Component, Input, OnInit } from "@angular/core";

import { PopoverController } from '@ionic/angular';

@Component({
    selector: 'expense-detail-option',
    template: `
        <ion-list>
            <ion-item (click)="dismiss('add_member')">
                <ion-icon slot="start" name="people"></ion-icon>
                <ion-label>{{'group.members' | localizedresource | async }}</ion-label>
            </ion-item>
            <ion-item (click)="dismiss('settle_up')" [disabled]="totalExpenses == 0">
                <ion-icon slot="start" name="people"></ion-icon>
                <ion-label>{{'group.settle_up' | localizedresource | async }}</ion-label>
            </ion-item>
        </ion-list>
    `,
})
export class ExpenseListingOption implements OnInit {
    @Input() totalExpenses: number;

    constructor(private popoverCtrl: PopoverController) {

    }

    ngOnInit() {
    }

    async dismiss(opt: 'add_member' | 'settle_up') {
        await this.popoverCtrl.dismiss(opt);
    }
}
import { Component, Input, OnInit } from "@angular/core";

import { PopoverController } from '@ionic/angular';
import { IExpense } from '../expense.model';

@Component({
    selector: 'expense-detail-option',
    template: `
        <ion-list>
            <ion-item (click)="dismiss('edit')" 
                [disabled]="expense.markedForAdd || expense.markedForUpdate || expense.markedForDelete">
                <ion-icon slot="start" name="pencil"></ion-icon>
                <ion-label>{{'common.edit' | localizedresource | async }}</ion-label>
            </ion-item>
            <!-- only can delete newly added item -->
            <ion-item (click)="dismiss('delete')" [disabled]="expense.markedForUpdate || expense.markedForDelete">
                <ion-icon color="danger" slot="start" name="trash"></ion-icon>
                <ion-label>{{'common.delete' | localizedresource | async }}</ion-label>
            </ion-item>
            <!-- forcely delete even if it is marked for edit/update -->
            <ion-item (click)="dismiss('delete_force')" [disabled]="expense.markedForAdd || !(expense.markedForUpdate || expense.markedForDelete)">
                <ion-icon color="danger" slot="start" name="trash"></ion-icon>
                <ion-label>{{'common.delete_force' | localizedresource | async }}</ion-label>
            </ion-item>
        </ion-list>
    `,
})
export class ExpenseDetailOption implements OnInit {
    @Input() expense: IExpense;

    constructor(private popoverCtrl: PopoverController) {

    }

    ngOnInit() {
    }

    async dismiss(opt: 'edit' | 'delete' | 'delete_force') {
        await this.popoverCtrl.dismiss(opt);
    }
}
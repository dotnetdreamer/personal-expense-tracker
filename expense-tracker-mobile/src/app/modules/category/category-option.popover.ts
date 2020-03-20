import { Component, ViewEncapsulation, OnInit } from "@angular/core";
import { PopoverController } from '@ionic/angular';


@Component({
    selector: 'category-options',
    encapsulation: ViewEncapsulation.None,
    template: `
        <ion-list>
            <ion-item (click)="dismiss('edit')">
                <ion-icon name="pencil-outline"></ion-icon>
                <ion-label>{{'common.edit' | localizedresource | async}}</ion-label>
            </ion-item>
            <ion-item (click)="dismiss('delete')">
                <ion-icon name="trash-outline"></ion-icon>
                <ion-label>{{'common.delete' | localizedresource | async}}</ion-label>
            </ion-item>
        </ion-list>
    `
})
export class CategoryOptionsPopover implements OnInit {
    constructor(private popoverCtrl: PopoverController) {

    }

    ngOnInit() {

    }

    async dismiss(data) {
        await this.popoverCtrl.dismiss(data);
    }
}
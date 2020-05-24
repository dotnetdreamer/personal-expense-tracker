import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';

import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

import { BasePage } from '../../shared/base.page';
import { ActivatedRoute } from '@angular/router';
import { AppConstant } from '../../shared/app-constant';
import { ExpenseService } from '../expense.service';
import { IExpense, IExpenseTransaction } from '../expense.model';
import { IAttachment } from '../../attachment/attachment.model';
import { Subscription } from 'rxjs';
import { PopoverController } from '@ionic/angular';
import { ExpenseDetailOption } from './expense-option.popover';
import { SyncConstant } from '../../shared/sync/sync-constant';
import { SyncEntity } from '../../shared/sync/sync.model';
import { GroupService } from '../../group/group.service';
import { FormateCurrencyPipe } from 'src/app/pipes/formateCurrency.pipe';

@Component({
  selector: 'page-expense-detail',
  templateUrl: './expense-detail.page.html',
  styleUrls: ['./expense-detail.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseDetailPage extends BasePage implements OnInit, OnDestroy {
  @ViewChild('attachment') attachmentElementRef: ElementRef;
  
  expense: IExpense;

  private _routeParamsSub: Subscription;

  constructor(private activatedRoute: ActivatedRoute
    , private popoverCtrl: PopoverController, private location: Location
    , private expenseSvc: ExpenseService, private groupSvc: GroupService
    , private formateCurrencyPipe: FormateCurrencyPipe) {
    super();
  }

  ngOnInit() {
    this._routeParamsSub = this.activatedRoute.params.subscribe(async params => {
      if(AppConstant.DEBUG) {
        console.log('ExpenseDetailPage: ngOnInit: params', params);
      }

      const { id } = params;
      await this._getExpense(+id);
    });
  }

  async onAttachmentClicked(expense: IExpense) {
    if(expense.attachment) {
      await Browser.open({ url: `${AppConstant.BASE_URL}${expense.attachment.attachment}` });
    }
  }

  async onMoreOptionsClicked(eve) {
    const popCtrl = await this.popoverCtrl.create({
      component: ExpenseDetailOption,
      event: eve,
      componentProps: {
        expense: this.expense
      }
    });
    await popCtrl.present();

    const { data } = await popCtrl.onDidDismiss();
    if(data == 'delete' || data == 'delete_force') {
      const res = await this.helperSvc.presentConfirmDialog();
      if(res) {
        //if newly added item, then remove it completly 
        if(data == 'delete') {
          if(this.expense.markedForAdd) {
            await this.expenseSvc.remove(this.expense.id);
          } else {
            this.expense.markedForDelete = true;
            this.expense.updatedOn = null;

            await this.expenseSvc.putLocal(this.expense);
          }
        } else if(data == 'delete_force') {
          await this.expenseSvc.remove(this.expense.id);
        }

        await this.location.back();
        
        this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH, SyncEntity.Expense);
        await this.helperSvc.presentToastGenericSuccess();
      }
    } else if(data == 'edit') {
      await this.navigate({ 
        path: '/expense/expense-create-or-update', 
        params: { 
          id: this.expense.id
        },
        extras: { replaceUrl: true }
      });
    }
  }
  

  ngOnDestroy() {
    if(this._routeParamsSub) {
      this._routeParamsSub.unsubscribe();
    }
  }

  private async _getExpense(id) {
    this.expense = await this.expenseSvc.getByIdLocal(id);
    if(AppConstant.DEBUG) {
      console.log('ExpenseDetailPage: ngOnInit: expense', this.expense);
    }

    if(this.expense.transactions && this.expense.transactions.length) {
      //sort by who paid
      this.expense.transactions.sort((a, b) => b.actualPaidAmount - a.actualPaidAmount);
      //add text
      this.expense.transactions.map(async (t) => {
        const formattedDebit = await this.formateCurrencyPipe.transform(t.debit);
        if(t.actualPaidAmount) {
          const formattedActualPaidAmount = await this.formateCurrencyPipe.transform(t.actualPaidAmount);
          const res = await this.localizationSvc.getResource('expense.transaction_text_paidby');
          t['text'] = res.format(t.name, formattedActualPaidAmount, formattedDebit);
        } else {
          const res2 = await this.localizationSvc.getResource('expense.transaction_text_owes');
          t['text'] = res2.format(t.name, formattedDebit);
        }
        return t;
      });
    }

    //read attachment
    this._readAttachment(this.expense.attachment);
  }

  private _readAttachment(attachment: IAttachment) {
    if(!attachment) {
      return;
    }

    const data = attachment.attachment;
    if(data.toString() === '[object ArrayBuffer]') {
      //local
    } else {
      //online
    }
    // if(typeof data == 'bigint')

    // const bytes = new Uint8Array(arrayBuffer);
    // const blob = new Blob([bytes.buffer]);

    // //to be used following for any type of file
    // // const url = URL.createObjectURL(blob);
    // // window.open(url, 'Name','resizable=1');

    // //to be used following for image
    // const image = this.attachmentElementRef.nativeElement;
    // const reader = new FileReader();
    // reader.onload = (e) => {
    //   image.src = e.target.result;
    // };
    // reader.readAsDataURL(blob);
  }

}

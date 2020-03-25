import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { BasePage } from '../../shared/base.page';
import { ActivatedRoute } from '@angular/router';
import { AppConstant } from '../../shared/app-constant';
import { ExpenseService } from '../expense.service';
import { IExpense } from '../expense.model';
import { IAttachment } from '../../attachment/attachment.model';

@Component({
  selector: 'page-expense-detail',
  templateUrl: './expense-detail.page.html',
  styleUrls: ['./expense-detail.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExpenseDetailPage extends BasePage implements OnInit {
  @ViewChild('attachment') attachmentElementRef: ElementRef;
  
  expense: IExpense;

  constructor(private activatedRoute: ActivatedRoute
    , private expenseSvc: ExpenseService) {
    super();
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(async params => {
      if(AppConstant.DEBUG) {
        console.log('ExpenseDetailPage: ngOnInit: params', params);
      }

      const { id } = params;
      await this._getExpese(+id);
    });
  }

  private async _getExpese(id) {
    this.expense = await this.expenseSvc.getByIdLocal(id);
    if(AppConstant.DEBUG) {
      console.log('ExpenseDetailPage: ngOnInit: expense', this.expense);
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

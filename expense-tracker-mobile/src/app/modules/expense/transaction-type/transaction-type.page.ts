import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TransactionType } from '../expense.model';

@Component({
  selector: 'modal-expense-transaction-type',
  templateUrl: './transaction-type.page.html',
  styleUrls: ['./transaction-type.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TransactionTypeModal implements OnInit {
  @Input() transactionType: TransactionType;
  
  TransactionType = TransactionType;
  selectedType;
  
  constructor(private modalCtrl: ModalController) { 

  }

  ngOnInit() { 
    if(this.transactionType) {
      this.selectedType = +this.transactionType;
    }
  }

  async onTypeClicked(type: TransactionType) {
    await this.dismiss(type);
  }


  async dismiss(data?) {
    await this.modalCtrl.dismiss(data);
  }
}

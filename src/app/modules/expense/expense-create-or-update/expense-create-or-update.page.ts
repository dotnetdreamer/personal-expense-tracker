import { Component, OnInit } from '@angular/core';

import { BasePage } from '../../shared/base.page';

@Component({
  selector: 'app-expense-create-or-update',
  templateUrl: './expense-create-or-update.page.html',
  styleUrls: ['./expense-create-or-update.page.scss'],
})
export class ExpenseCreateOrUpdatePage extends BasePage implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
  }


  async onSaveClick() {

  }

}

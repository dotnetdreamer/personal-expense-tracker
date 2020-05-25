import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import { BasePage } from '../../shared/base.page';

@Component({
  selector: 'page-user-listing',
  templateUrl: './user-listing.page.html',
  styleUrls: ['./user-listing.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserListingPage extends BasePage implements OnInit {

  constructor() { 
    super();
  }

  ngOnInit() {
  }

}

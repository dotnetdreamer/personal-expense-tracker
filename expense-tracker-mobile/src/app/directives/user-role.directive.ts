import { Directive, Input, OnChanges, SimpleChanges, Renderer2, ElementRef, AfterViewInit } from '@angular/core';

import { UserRole } from '../modules/authentication/user.model';

@Directive({
  selector: '[userRole]'
})
export class UserRoleDirective implements AfterViewInit, OnChanges {
    @Input('userRole') role: UserRole;

    private _el: HTMLElement;

    constructor(private renderer: Renderer2, private elementRef: ElementRef) { 
    }

    ngAfterViewInit() {
        this._el = this.elementRef.nativeElement;
    }

    ngOnChanges(changes: SimpleChanges){
        if(changes.role && this._el) {
            if(changes.role.currentValue != UserRole.Admin) {
                this.renderer.setStyle(this._el, 'display', 'none');
            } else {
                this.renderer.removeStyle(this._el, 'display');
            }
        }
    }
}
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { 

  }

  transform(url, type: any) {
    if(!url) {
      return;
    }
    let result;
    const context = <SecurityContext>type;
    switch(context) {
        case SecurityContext.URL:
            result = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        break;
        case SecurityContext.STYLE:
            result = this.sanitizer.bypassSecurityTrustStyle(url);
        break;
        default:
        break;
    }
    return result;
  }
}

export enum SecurityContext {
    NONE = 'none',
    HTML = 'html',
    STYLE = 'style',
    SCRIPT = 'script',
    URL = 'url',
    RESOURCE_URL = 'resource'
}
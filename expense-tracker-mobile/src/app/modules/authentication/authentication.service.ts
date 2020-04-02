import { Injectable } from "@angular/core";

import { IUser } from './authentication.model';
import { UserSettingService } from './user-setting.service';
import { BaseService } from '../shared/base.service';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService extends BaseService {
    constructor(private userSettingSvc: UserSettingService) {
        super();
    }

    async getUserProfileLocal(username?): Promise<IUser> {
        return new Promise<IUser>(async (resolve, reject) => {
            if(!username) {
              username = await this.userSettingSvc.getCurrentUser();
            }
            if(!username) {
              resolve();
              return;
            }
            username = username.toLowerCase();
            let profile = await this.dbService.get<IUser>(this.schemaService.tables.user, username);
            // profile.MediaPath = UserConstant.BASE_URL + profile.MediaPath + profile.MediaName;            
            resolve(profile);
        });
    }
    
    removeUserProfileLocal(username) {
        username = username.toLowerCase();
        return this.dbService.remove(this.schemaService.tables.user, username);
    }

    putUserProfileLocal(user: IUser) {
        user.email = user.email.toLowerCase();
        return this.dbService.putLocal(this.schemaService.tables.user, user);
    }    

}
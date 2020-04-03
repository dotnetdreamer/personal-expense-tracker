import { Injectable } from "@angular/core";

import { IUser, IUserProfile } from './authentication.model';
import { UserSettingService } from './user-setting.service';
import { BaseService } from '../shared/base.service';
import { AppInjector } from '../shared/app-injector';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService extends BaseService {
    protected userSettingSvc: UserSettingService;
    constructor() {
        super();

        const injector = AppInjector.getInjector();
        this.userSettingSvc = injector.get(UserSettingService);
    }

    async getUserProfileLocal(username?): Promise<IUserProfile> {
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
            profile = this.setUserDefaults(profile);

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
    
    setUserDefaults(user: IUser): IUserProfile {
        const profile: IUserProfile = { ...user };
        if(profile.photo) {
            profile.photoStyle = `url('${profile.photo}')`;
        }

        return profile;
    }
}
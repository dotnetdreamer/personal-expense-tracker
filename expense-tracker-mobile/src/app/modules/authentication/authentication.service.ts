import { Injectable } from "@angular/core";


import { IUser, IUserProfile, LoginType, ILoginParams, IGoogleAuthResponse } from './authentication.model';
import { UserSettingService } from './user-setting.service';
import { BaseService } from '../shared/base.service';
import { AuthenticationGoogleService } from './authentication-google.service';
import { UserConstant } from './user-constant';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService extends BaseService {
    constructor(private userSettingSvc: UserSettingService
        , private googleAuthSvc: AuthenticationGoogleService) {
        super();
    }

    async login(loginType: LoginType) {
      let loader;
      try {
        let user: IUser;

        switch(loginType) {
          case LoginType.GOOGLE:
            user = await this.googleAuthSvc.login();
          break;
        }

        if(!user) {
          return;
        }

        loader = await this.helperSvc.loader;
        await loader.present();

        await this._handleLoginResponse({ loginType: loginType, user: user }, loader);
      } catch (e) {
        if(loader) {
          await loader.dismiss();
        }
        alert(e.toString());
      }
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

    logout(username?) {
        return new Promise(async (resolve, reject) => {
            const loginType = await this.userSettingSvc.getLoggedInMethod();
            switch(loginType) {
                case LoginType.GOOGLE:
                    await this.googleAuthSvc.logout();
                break;
            }
            
            if(!username) {
                username = await this.userSettingSvc.getCurrentUser();
            }
        
            if(!username) {
                return;
            }

            await Promise.all([
                this.removeUserProfileLocal(username), 
                this.userSettingSvc.removeCurrentUser(), 
                this.userSettingSvc.removeLoggedInMethod(),
                this.userSettingSvc.removeCurrentUserPassword()
            ]);

            this.eventPub.$pub(UserConstant.EVENT_USER_LOGGEDOUT);
            resolve();
        });
    }

      
  private async _handleLoginResponse(args: ILoginParams, loader?: HTMLIonLoadingElement) {
    const promises = [];

    let profilePromise = this.putUserProfileLocal(args.user);
    promises.push(profilePromise);

    let loginTypePromise = this.userSettingSvc.putLoggedInMethod(args.loginType);
    promises.push(loginTypePromise);

    if(args.loginType == LoginType.STANDARD) {
      let currentUserPromise = this.userSettingSvc.putCurrentUser(args.email);
      promises.push(currentUserPromise);

      //TODO: need to remvoe storing password
      let passwordPromise =  this.userSettingSvc.putCurrentUserPassword(args.password);
      promises.push(passwordPromise);
    } else {
      let currentUserPromise = this.userSettingSvc.putCurrentUser(args.user.email);
      promises.push(currentUserPromise);
    }

    try {
      await Promise.all(promises);

      //fire the user loggedin event
      const profile = this.setUserDefaults(args.user);
      this.eventPub.$pub(UserConstant.EVENT_USER_LOGGEDIN, { 
        user: profile, 
        redirectToHome: true,
        pull: true
      });
    } catch(e) {
      throw e;
    } finally {
      if(loader) {
        await loader.dismiss();
      }
    }
  }
}
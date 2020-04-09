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
  private readonly BASE_URL = "user";

  constructor(private userSettingSvc: UserSettingService
      , private googleAuthSvc: AuthenticationGoogleService) {
      super();
  }

  authenticate(args: { email, password }) {
    return this.postData<any>({ 
      url: `app/authenticate`,
      body: {
        email: args.email,
        password: args.password
      }
    });
  }

  async login(loginType: LoginType, args?: { email, password }) {
    let loader;
    try {
      let user: IUser;

      switch(loginType) {
        case LoginType.STANDARD:
          user = await this.authenticate({ email: args.email, password: args.password });
          break;
        case LoginType.GOOGLE:
          user = await this.googleAuthSvc.login();
        break;
      }

      if(!user) {
        return null;
      }

      loader = await this.helperSvc.loader;
      await loader.present();

      return this._handleLoginResponse({ loginType: loginType, user: user }, loader);
    } catch (e) {
      if(loader) {
        await loader.dismiss();
      }
      let msg = e.toString();
      if(e.error) {
        msg = e.error.toString();
      }
      if(e.error.error_description) {
        msg += "\n" + e.error.error_description;
      }
      await this.helperSvc.presentToast(msg, false);
    }
  }

  register(args: { email, mobile, name, password })
    : Promise<{ data?, message? }> {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.postData<{ data?, message? }> ({ 
          url: `${this.BASE_URL}/register`,
          body: args
        });

        resolve(res);
      } catch(e) {
        reject(e);
      }
    });
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

          this.pubsubSvc.publishEvent(UserConstant.EVENT_USER_LOGGEDOUT);
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
      //TODO: need to remvoe storing password
      // let passwordPromise =  this.userSettingSvc.putCurrentUserPassword(args.password);
      // promises.push(passwordPromise);
    }

    let currentUserPromise = this.userSettingSvc.putCurrentUser(args.user.email);
    promises.push(currentUserPromise);

    try {
      await Promise.all(promises);

      //fire the user loggedin event
      const profile = this.setUserDefaults(args.user);
      return profile;
    } catch(e) {
      throw e;
    } finally {
      if(loader) {
        await loader.dismiss();
      }
    }
  }
}
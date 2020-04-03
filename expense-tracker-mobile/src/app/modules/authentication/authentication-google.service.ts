import { AuthenticationService } from './authentication.service';
import { Injectable, NgZone } from '@angular/core';
import { IUser } from './authentication.model';


//added in index.html
declare const gapi: any;

@Injectable({
    providedIn: 'root'
})
export class AuthenticationGoogleService {
    private _auth2;

    constructor(private ngZone: NgZone) {
        // this.init();
    }

    //https://developers.google.com/identity/sign-in/web/build-button
    init() {
        return new Promise((resolve, reject) => {
            //google secret: FSf6IfmSSg_T9_T2D3TAlTIh
            if(this._auth2) {
                // Sign in the user if they are currently signed in.
                // console.log('signedin', this._auth2.isSignedIn.get())
                // if (this._auth2.isSignedIn.get() == true) {
                //     this._auth2.signIn();
                //     const gUser = this._auth2.currentUser.get();
                //     successCallback(this._getValues(gUser));
                //     return;
                // } 
                return;
            }

            gapi.load('auth2', async () => {
                // Retrieve the singleton for the GoogleAuth library and set up the client.
                this._auth2 = gapi.auth2.init({
                    client_id: `481765426823-3c4gmsn2bbk3mrghqm0q6ng70d7mrqbl.apps.googleusercontent.com`,
                    cookiepolicy: 'single_host_origin',
                    // Request scopes in addition to 'profile' and 'email'
                    scope: 'profile'
                });

                // // Listen for sign-in state changes.
                // this._auth2.isSignedIn.listen((args) => this._signinChanged(args));

                // // Listen for changes to current user.
                // this._auth2.currentUser.listen((args) => this._userChanged(args));

                resolve();
            });
        });
    }

    async attachButtonHandler(googleBtnElement
        , successCallback: (params: IUser) => void
        , errorCallback: (params: { error: 'popup_closed_by_user' }) => void
    ) {
        if(googleBtnElement && successCallback && errorCallback) {
            if(!this._auth2) {
                await this.init();
            }

            this._auth2.attachClickHandler(googleBtnElement, {}
            , (gUser) => {
                this.ngZone.run(() => {
                    successCallback(this._getValues(gUser));
                });
            }, errorCallback);
        }
    }

    logout() {
        //https://developers.google.com/identity/sign-in/web/disconnect
        // this._auth2.disconnect();
    }

    private _signinChanged(val) {
        console.log('AuthenticationGoogleService: Signin state changed to ', val);
    }

    private _userChanged(gUser) {
        console.log('AuthenticationGoogleService: _userChanged now: ', gUser);
        const profile = this._getValues(gUser);
    }

    private _getValues(gUser) {
        // const gUser = this._auth2.currentUser.get();
        const id = gUser.getBasicProfile().getId();
        const name = gUser.getBasicProfile().getName();
        const email = gUser.getBasicProfile().getEmail();
        const photo = gUser.getBasicProfile().getImageUrl();
        
        const gUserProfile: IUser = {
          uuid: id,
          name: name,
          email: email.toLowerCase(),
          photo: photo
        };
        return gUserProfile;
    }
}
import { AuthenticationService } from './authentication.service';
import { Injectable } from '@angular/core';


//added in index.html
declare const gapi: any;

@Injectable()
export class AuthenticationGoogleService extends AuthenticationService {
    private _auth2;

    constructor() {
        super();
    }

    //https://developers.google.com/identity/sign-in/web/build-button
    init(googleBtnElement, successCallback, errorCallback): Promise<void> {
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
                client_id: `1041336426910-ajga5fvc4e9p61ro7nc1kuiprig7hb9r.apps.googleusercontent.com`,
                cookiepolicy: 'single_host_origin',
                // Request scopes in addition to 'profile' and 'email'
                scope: 'profile'
            });

            // // Listen for sign-in state changes.
            // this._auth2.isSignedIn.listen((args) => this._signinChanged(args));

            // // Listen for changes to current user.
            // this._auth2.currentUser.listen((args) => this._userChanged(args));

            this._auth2.attachClickHandler(googleBtnElement, {}
            , (gUser) => {
                successCallback(this._getValues(gUser));
            }, errorCallback);
        });
    }

    revokeAllScopes() {
        this._auth2.disconnect();
    }

    private _signinChanged(val) {
        console.log('Signin state changed to ', val);
    }

    private _userChanged(gUser) {
        console.log('_userChanged now: ', gUser);
        const profile = this._getValues(gUser);
    }

    private _getValues(gUser) {
        // const gUser = this._auth2.currentUser.get();
        const id = gUser.getBasicProfile().getId();
        const name = gUser.getBasicProfile().getName();
        const email = gUser.getBasicProfile().getEmail();
        const photo = gUser.getBasicProfile().getImageUrl();
        
        const gUserProfile = {
          id: id,
          name: name,
          email: email,
          photo: photo
        };
        return gUserProfile;
    }
}
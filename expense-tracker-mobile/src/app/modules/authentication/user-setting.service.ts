import { Injectable } from "@angular/core";

import { UserConstant } from './user-constant';
import { AppSettingService } from '../shared/app-setting.service';


@Injectable({
    providedIn: 'root'
})
export class UserSettingService extends AppSettingService {
    constructor() {
        super();
    }

    putFingerprintEnabled(value = true) {
        return this.dbService.putLocal(this.schemaService.tables.setting, {
            key: UserConstant.KEY_FINGERPRINT_ENABLED,
            value: value == true ? 'yes' : 'no'
        }).then(() => {
            AppSettingService.settingCache.set(UserConstant.KEY_FINGERPRINT_ENABLED, value);
        });
    }

    getFingerprintEnabled() {
        return this.get(UserConstant.KEY_FINGERPRINT_ENABLED)
            .then(value => {
                if(typeof value === 'undefined' || value === null) {
                    return value;
                }
                return value == 'yes' || value == true;
            });    
    }


    getCurrentUser() {
        return this.get<string>(UserConstant.KEY_CURRENT_USER);
    }

    putCurrentUser(values) {
        return this.dbService.putLocal(this.schemaService.tables.setting, {
            key: UserConstant.KEY_CURRENT_USER,
            value: values
        }).then(() => {
            AppSettingService.settingCache.set(UserConstant.KEY_CURRENT_USER, values);
        });
    }

    removeCurrentUser() {
        return this.dbService.remove(this.schemaService.tables.setting, UserConstant.KEY_CURRENT_USER)
        .then(() => {
            AppSettingService.settingCache.delete(UserConstant.KEY_CURRENT_USER);
        });
    }

    getLoggedInMethod() {
        return this.get(UserConstant.KEY_LOGGEDIN_METHOD)
            .then(loggedInMethod => {
                return loggedInMethod;
            });
    } 

    putLoggedInMethod(values) {
        return this.dbService.putLocal(this.schemaService.tables.setting, {
            key: UserConstant.KEY_LOGGEDIN_METHOD,
            value: values
        }).then(() => {
            AppSettingService.settingCache.set(UserConstant.KEY_LOGGEDIN_METHOD, values);
        });
    }

    removeLoggedInMethod() {
        return this.dbService.remove(this.schemaService.tables.setting, UserConstant.KEY_LOGGEDIN_METHOD)
        .then(() => {
            AppSettingService.settingCache.delete(UserConstant.KEY_LOGGEDIN_METHOD);
        });
    }

    putCurrentUserPassword(values) {
        return this.dbService.putLocal(this.schemaService.tables.setting, {
            key: UserConstant.KEY_CURRENT_USER_PASSWORD,
            value: values
        }).then(() => {
            AppSettingService.settingCache.set(UserConstant.KEY_CURRENT_USER_PASSWORD, values);
        });
    }
    
    removeCurrentUserPassword() {
        return this.dbService.remove(this.schemaService.tables.setting, UserConstant.KEY_CURRENT_USER_PASSWORD)
        .then(() => {
            AppSettingService.settingCache.delete(UserConstant.KEY_CURRENT_USER_PASSWORD);
        });
    }


    getCurrentUserPassword() {
        return this.get<string>(UserConstant.KEY_CURRENT_USER_PASSWORD)
            .then(currentUserPassword => {
                return currentUserPassword;
            });
    }
}
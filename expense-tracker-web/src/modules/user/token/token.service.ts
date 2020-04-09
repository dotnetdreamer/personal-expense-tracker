import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as moment from 'moment';

import { AccessToken } from "./token.entity";
import { AppConstant } from "src/modules/shared/app-constant";

@Injectable()
export class TokenService {
    constructor(
        @InjectRepository(AccessToken)
        private userRepo: Repository<AccessToken>
      ) {}

    findByAccessToken(accessToken) {
        return this.userRepo.findOne({ accessToken: accessToken });
    }
    
    findByRefreshToken(refreshToken) {
        return this.userRepo.findOne({ refreshToken: refreshToken });
    }

    findByUserId(userId) {
        return this.userRepo.findOne({ userId: userId });
    }

    async save(token: AccessToken) {
        let newOrUpdated: AccessToken;

        const existingToken = await this.findByAccessToken(token.accessToken);
        if(existingToken) {
            newOrUpdated = Object.assign({}, existingToken);
            if(typeof newOrUpdated.updatedOn === 'undefined') {
                newOrUpdated.updatedOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
        } else {
            newOrUpdated = Object.assign({}, token);
        }
        
        if(typeof newOrUpdated.createdOn === 'undefined') {
            newOrUpdated.createdOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }
    
        //now save
        const newlyAddedOrUpdated = await this.userRepo.save<AccessToken>(newOrUpdated);
        // const pareparedUser = this._prepareUser(newlyAddedOrUpdated);

        return newlyAddedOrUpdated;
    }
}
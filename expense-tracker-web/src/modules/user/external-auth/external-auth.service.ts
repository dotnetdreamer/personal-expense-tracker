import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import * as moment from 'moment';

import { ExternalAuth } from "./external-auth.entity";
import { AppConstant } from "src/modules/shared/app-constant";

@Injectable()
export class ExternalAuthService {
    constructor(
        @InjectRepository(ExternalAuth)
        private externalAuthRepo: Repository<ExternalAuth>
      ) {}

    findByEmail(email) {
        return this.externalAuthRepo.findOne({ email: email });
    }

    async save(externalAuth: ExternalAuth) {
        let newOrUpdated: ExternalAuth;

        const existingAuth = await this.findByEmail(externalAuth.email);
        if(existingAuth) {
            newOrUpdated = Object.assign({}, existingAuth);
            if(typeof newOrUpdated.updatedOn === 'undefined') {
                newOrUpdated.updatedOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
        } else {
            newOrUpdated = Object.assign({}, externalAuth);
        }
        
        if(typeof newOrUpdated.createdOn === 'undefined') {
            newOrUpdated.createdOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }
    
        //now save
        const newlyAddedOrUpdated = await this.externalAuthRepo.save<ExternalAuth>(newOrUpdated);
        return newlyAddedOrUpdated;
    }
}
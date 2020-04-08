import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as moment from 'moment';

import { IRegistrationParams } from "./user.model";
import { User } from "./user.entity";
import { AppConstant } from "../shared/app-constant";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>
      ) {}

    register(user: IRegistrationParams) {
        let newOrUpdated: any = Object.assign({}, user);
        if(typeof newOrUpdated.isDeleted === 'undefined') {
            newOrUpdated.isDeleted = false;
        }

        if(typeof newOrUpdated.createdOn === 'undefined') {
            newOrUpdated.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }

        //now save
        return this.userRepo.save<User>(newOrUpdated);
    }
}
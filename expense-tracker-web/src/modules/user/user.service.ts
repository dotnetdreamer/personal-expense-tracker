import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import * as moment from 'moment';
import * as bcrypt from 'bcrypt';

import { IRegistrationParams } from "./user.model";
import { User } from "./user.entity";
import { AppConstant } from "../shared/app-constant";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>
      ) {}

    findByEmail(email) {
        return this.userRepo.findOne({ email: email });
    }

    async validateUser(args: { email, password }): Promise<any> {
        const user = await this.findByEmail(args.email);
        if(!user) {
            return null;
        }

        const match = await bcrypt.compare(args.password, user.password);
        if (match) {
            return this._prepareUser(user);
        }

        return null;
    }

    async register(user: IRegistrationParams): Promise<{ data?, message? }> {
        //validate
        const exist = await this.findByEmail(user.email);
        if(exist) {
            return { message: 'User already exist' };
        }

        let newOrUpdated: any = Object.assign({}, user);
        if(typeof newOrUpdated.isDeleted === 'undefined') {
            newOrUpdated.isDeleted = false;
        }

        if(typeof newOrUpdated.createdOn === 'undefined') {
            newOrUpdated.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }

        //password
        const hasPassword = await bcrypt.hash(newOrUpdated.password, AppConstant.DEFAULT_PASSWORD_SALT_ROUNDS);
        newOrUpdated.password = hasPassword;

        //now save
        const newUser = await this.userRepo.save<User>(newOrUpdated);
        const pareparedUser = this._prepareUser(<any>newUser);

        return { data: pareparedUser };
    }

    private _prepareUser(user: User) {
        const { password, isDeleted, id, ...result } = user;
        return result;
    }
}